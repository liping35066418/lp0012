const express = require('express');
const router = express.Router();
const db = require('../database');
const logger = require('../logger');
const { authMiddleware, requireRole } = require('../middleware');

router.get('/my', authMiddleware, (req, res) => {
  const { is_read } = req.query;
  let sql = `SELECT n.*, c.name as club_name FROM notifications n LEFT JOIN clubs c ON n.club_id = c.id WHERE n.user_id = ?`;
  const params = [req.user.id];
  if (is_read !== undefined && is_read !== '') {
    sql += ' AND n.is_read = ?';
    params.push(is_read);
  }
  sql += ' ORDER BY n.created_at DESC LIMIT 50';
  try {
    const list = db.prepare(sql).all(...params);
    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;
    res.json({ code: 200, data: { list, unreadCount } });
  } catch (err) {
    logger.error('获取通知失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.post('/:id/read', authMiddleware, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ code: 200, message: '标记已读成功' });
  } catch (err) {
    logger.error('标记已读失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.post('/read-all', authMiddleware, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ code: 200, message: '全部标记已读' });
  } catch (err) {
    logger.error('全部标记已读失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.post('/push', authMiddleware, requireRole('admin', 'officer'), (req, res) => {
  const { user_ids, club_id, title, content, type = 'system' } = req.body;
  if (!title || !content) return res.json({ code: 400, message: '标题和内容必填' });
  const tx = db.transaction(() => {
    let targetUserIds = user_ids || [];
    if (!targetUserIds.length && club_id) {
      targetUserIds = db.prepare('SELECT user_id FROM members WHERE club_id = ?').all(club_id).map(m => m.user_id);
    }
    if (!targetUserIds.length) {
      targetUserIds = db.prepare('SELECT id FROM users').all().map(u => u.id);
    }
    const insert = db.prepare('INSERT INTO notifications (user_id, title, content, type, club_id) VALUES (?, ?, ?, ?, ?)');
    targetUserIds.forEach(uid => {
      insert.run(uid, title, content, type, club_id || null);
    });
    return targetUserIds.length;
  });
  try {
    const count = tx();
    logger.info('推送通知:', { title, count, pusher: req.user.username });
    res.json({ code: 200, message: `推送成功，共${count}人` });
  } catch (err) {
    logger.error('推送失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
