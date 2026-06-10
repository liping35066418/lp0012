const express = require('express');
const router = express.Router();
const db = require('../database');
const logger = require('../logger');
const { authMiddleware, requireRole } = require('../middleware');

router.get('/', authMiddleware, requireRole('admin', 'officer'), (req, res) => {
  const { club_id, keyword, position } = req.query;
  let sql = `SELECT m.*, u.username, u.real_name, u.phone, u.email, u.avatar, u.created_at as user_created, c.name as club_name
    FROM members m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN clubs c ON m.club_id = c.id
    WHERE 1=1`;
  const params = [];
  if (club_id) { sql += ' AND m.club_id = ?'; params.push(club_id); }
  if (position) { sql += ' AND m.position = ?'; params.push(position); }
  if (keyword) {
    const kw = `%${keyword}%`;
    sql += ' AND (u.real_name LIKE ? OR u.username LIKE ? OR u.phone LIKE ?)';
    params.push(kw, kw, kw);
  }
  sql += ' ORDER BY m.join_date DESC';
  try {
    const list = db.prepare(sql).all(...params);
    const stats = {
      total: list.length,
      byPosition: {}
    };
    list.forEach(m => {
      stats.byPosition[m.position] = (stats.byPosition[m.position] || 0) + 1;
    });
    res.json({ code: 200, data: { list, stats } });
  } catch (err) {
    logger.error('获取成员列表失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.put('/:id', authMiddleware, requireRole('admin', 'officer'), (req, res) => {
  const { position } = req.body;
  try {
    db.prepare('UPDATE members SET position = ? WHERE id = ?').run(position || 'member', req.params.id);
    logger.info('更新成员职位:', { id: req.params.id, position, operator: req.user.username });
    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    logger.error('更新成员失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin', 'officer'), (req, res) => {
  const tx = db.transaction(() => {
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (!member) throw new Error('成员不存在');
    db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE clubs SET current_members = MAX(0, current_members - 1) WHERE id = ?').run(member.club_id);
    const hasOther = db.prepare('SELECT COUNT(*) as count FROM members WHERE user_id = ?').get(member.user_id).count;
    if (hasOther === 0) {
      db.prepare('UPDATE users SET club_id = NULL WHERE id = ?').run(member.user_id);
    }
  });
  try {
    tx();
    logger.info('移除成员:', { id: req.params.id, operator: req.user.username });
    res.json({ code: 200, message: '移除成功' });
  } catch (err) {
    logger.error('移除成员失败:', err);
    res.json({ code: 400, message: err.message });
  }
});

router.get('/export', authMiddleware, requireRole('admin', 'officer'), (req, res) => {
  const { club_id } = req.query;
  let sql = `SELECT m.*, u.username, u.real_name, u.phone, u.email, c.name as club_name
    FROM members m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN clubs c ON m.club_id = c.id`;
  const params = [];
  if (club_id) { sql += ' WHERE m.club_id = ?'; params.push(club_id); }
  try {
    const list = db.prepare(sql).all(...params);
    const csv = [
      '社团,姓名,用户名,手机号,邮箱,职位,加入时间',
      ...list.map(m => [m.club_name, m.real_name, m.username, m.phone, m.email, m.position, m.join_date].join(','))
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=members.csv');
    res.send('\ufeff' + csv);
  } catch (err) {
    logger.error('导出成员失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
