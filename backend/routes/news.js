const express = require('express');
const router = express.Router();
const db = require('../database');
const logger = require('../logger');
const { authMiddleware, requireRole } = require('../middleware');

router.get('/', (req, res) => {
  try {
    const { club_id, status, keyword, page = 1, pageSize = 10 } = req.query;
    let sql = `SELECT n.*, c.name as club_name, u.real_name as author_name FROM news n
      LEFT JOIN clubs c ON n.club_id = c.id
      LEFT JOIN users u ON n.author_id = u.id
      WHERE 1=1`;
    let countSql = 'SELECT COUNT(*) as count FROM news n WHERE 1=1';
    const params = [], countParams = [];
    if (club_id) { sql += ' AND n.club_id = ?'; countSql += ' AND n.club_id = ?'; params.push(club_id); countParams.push(club_id); }
    if (status !== undefined && status !== '') { sql += ' AND n.status = ?'; countSql += ' AND n.status = ?'; params.push(status); countParams.push(status); }
    if (keyword) {
      const kw = `%${keyword}%`;
      sql += ' AND (n.title LIKE ? OR n.content LIKE ?)';
      countSql += ' AND (n.title LIKE ? OR n.content LIKE ?)';
      params.push(kw, kw);
      countParams.push(kw, kw);
    }
    sql += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
    const list = db.prepare(sql).all(...params);
    const total = db.prepare(countSql).get(...countParams).count;
    res.json({ code: 200, data: { list, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    logger.error('获取动态列表失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const news = db.prepare(`
      SELECT n.*, c.name as club_name, u.real_name as author_name
      FROM news n
      LEFT JOIN clubs c ON n.club_id = c.id
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.id = ?
    `).get(req.params.id);
    if (!news) return res.json({ code: 404, message: '动态不存在' });
    res.json({ code: 200, data: news });
  } catch (err) {
    logger.error('获取动态详情失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.post('/', authMiddleware, requireRole('admin', 'officer'), (req, res) => {
  const { club_id, title, content, cover_image } = req.body;
  if (!title) return res.json({ code: 400, message: '标题必填' });
  try {
    const info = db.prepare(`INSERT INTO news (club_id, title, content, cover_image, author_id, status) VALUES (?, ?, ?, ?, ?, ?)`).run(
      club_id || null, title, content || '', cover_image || '', req.user.id, req.user.role === 'admin' ? 1 : 0
    );
    logger.info('动态发布:', { id: info.lastInsertRowid, title, user: req.user.username });
    res.json({ code: 200, message: '发布成功，' + (req.user.role === 'admin' ? '已发布' : '等待审核'), data: { id: info.lastInsertRowid } });
  } catch (err) {
    logger.error('动态发布失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.post('/:id/review', authMiddleware, requireRole('admin'), (req, res) => {
  const { status } = req.body;
  if (![0, 1, 2].includes(Number(status))) {
    return res.json({ code: 400, message: '状态无效' });
  }
  try {
    db.prepare('UPDATE news SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.user.id, req.params.id);
    const news = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
    if (news.author_id) {
      db.prepare('INSERT INTO notifications (user_id, title, content, type, club_id) VALUES (?, ?, ?, ?, ?)').run(
        news.author_id,
        status === 1 ? '动态审核通过' : '动态审核未通过',
        status === 1 ? '您发布的动态已通过审核并发布' : '您发布的动态未通过审核',
        'review',
        news.club_id
      );
    }
    logger.info('动态审核:', { id: req.params.id, status, reviewer: req.user.username });
    res.json({ code: 200, message: '审核成功' });
  } catch (err) {
    logger.error('动态审核失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
