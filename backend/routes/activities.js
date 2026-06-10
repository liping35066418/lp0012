const express = require('express');
const router = express.Router();
const db = require('../database');
const logger = require('../logger');
const { authMiddleware, requireRole } = require('../middleware');

router.get('/', (req, res) => {
  try {
    const { club_id, keyword } = req.query;
    let sql = `SELECT a.*, c.name as club_name FROM activities a JOIN clubs c ON a.club_id = c.id WHERE a.status = 1`;
    const params = [];
    if (club_id) { sql += ' AND a.club_id = ?'; params.push(club_id); }
    if (keyword) { sql += ' AND (a.title LIKE ? OR a.description LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
    sql += ' ORDER BY a.created_at DESC';
    const list = db.prepare(sql).all(...params);
    res.json({ code: 200, data: list });
  } catch (err) {
    logger.error('获取活动列表失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const activity = db.prepare(`
      SELECT a.*, c.name as club_name, c.logo as club_logo,
      (SELECT COUNT(*) FROM activity_enrollments WHERE activity_id = a.id AND status = 1) as enrolled_count
      FROM activities a
      JOIN clubs c ON a.club_id = c.id
      WHERE a.id = ?
    `).get(req.params.id);
    if (!activity) {
      return res.json({ code: 404, message: '活动不存在' });
    }
    const enrollments = db.prepare(`
      SELECT ae.*, u.real_name, u.username, u.phone
      FROM activity_enrollments ae
      LEFT JOIN users u ON ae.user_id = u.id
      WHERE ae.activity_id = ? AND ae.status = 1
      ORDER BY ae.enrolled_at DESC
    `).all(req.params.id);
    res.json({ code: 200, data: { ...activity, enrollments } });
  } catch (err) {
    logger.error('获取活动详情失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.post('/', authMiddleware, requireRole('admin', 'officer'), (req, res) => {
  const { club_id, title, description, poster, location, start_time, end_time, max_participants } = req.body;
  if (!club_id || !title) return res.json({ code: 400, message: '请填写必填项' });
  try {
    const info = db.prepare(`INSERT INTO activities (club_id, title, description, poster, location, start_time, end_time, max_participants, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      club_id, title, description || '', poster || '', location || '', start_time, end_time, max_participants || 0, req.user.id
    );
    logger.info('活动发布:', { id: info.lastInsertRowid, title, user: req.user.username });
    res.json({ code: 200, message: '发布成功', data: { id: info.lastInsertRowid } });
  } catch (err) {
    logger.error('活动发布失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.post('/:id/enroll', authMiddleware, (req, res) => {
  const { real_name, phone } = req.body;
  const tx = db.transaction(() => {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
    if (!activity) throw new Error('活动不存在');
    if (activity.max_participants > 0) {
      const count = db.prepare('SELECT COUNT(*) as count FROM activity_enrollments WHERE activity_id = ? AND status = 1').get(req.params.id).count;
      if (count >= activity.max_participants) throw new Error('活动名额已满');
    }
    const exists = db.prepare('SELECT COUNT(*) as count FROM activity_enrollments WHERE activity_id = ? AND user_id = ?').get(req.params.id, req.user.id).count;
    if (exists > 0) throw new Error('您已报名该活动');
    db.prepare(`INSERT INTO activity_enrollments (activity_id, user_id, real_name, phone) VALUES (?, ?, ?, ?)`).run(
      req.params.id, req.user.id, real_name || req.user.real_name, phone || ''
    );
    db.prepare('UPDATE activities SET current_participants = current_participants + 1 WHERE id = ?').run(req.params.id);
    return activity;
  });
  try {
    const activity = tx();
    logger.info('活动报名成功:', { activityId: req.params.id, user: req.user.username });
    res.json({ code: 200, message: '报名成功', data: { activity } });
  } catch (err) {
    logger.error('活动报名失败:', err);
    res.json({ code: 400, message: err.message });
  }
});

router.get('/:id/enrollments', authMiddleware, requireRole('admin', 'officer'), (req, res) => {
  try {
    const enrollments = db.prepare(`
      SELECT ae.*, u.real_name, u.username, u.phone, u.email
      FROM activity_enrollments ae
      LEFT JOIN users u ON ae.user_id = u.id
      WHERE ae.activity_id = ?
      ORDER BY ae.enrolled_at DESC
    `).all(req.params.id);
    const stats = {
      total: enrollments.length,
      confirmed: enrollments.filter(e => e.status === 1).length
    };
    res.json({ code: 200, data: { list: enrollments, stats } });
  } catch (err) {
    logger.error('获取活动报名名单失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.put('/:id', authMiddleware, requireRole('admin', 'officer'), (req, res) => {
  const { title, description, poster, location, start_time, end_time, max_participants, status } = req.body;
  try {
    db.prepare(`UPDATE activities SET title = COALESCE(?, title), description = COALESCE(?, description), poster = COALESCE(?, poster), location = COALESCE(?, location), start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time), max_participants = COALESCE(?, max_participants), status = COALESCE(?, status) WHERE id = ?`).run(title, description, poster, location, start_time, end_time, max_participants, status, req.params.id);
    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    logger.error('更新活动失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
