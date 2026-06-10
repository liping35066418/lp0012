const express = require('express');
const router = express.Router();
const db = require('../database');
const logger = require('../logger');
const { authMiddleware, requireRole } = require('../middleware');

router.get('/banners', (req, res) => {
  try {
    const banners = db.prepare('SELECT * FROM club_banners WHERE status = 1 ORDER BY sort_order ASC').all();
    res.json({ code: 200, data: banners });
  } catch (err) {
    logger.error('获取轮播图失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.get('/', (req, res) => {
  try {
    const clubs = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.club_id = c.id AND e.status = 'pending') as pending_enrollments,
        (SELECT COUNT(*) FROM members m WHERE m.club_id = c.id) as approved_members
      FROM clubs c WHERE c.status = 1 ORDER BY c.id ASC
    `).all();
    clubs.forEach(c => {
      c.approved_members = c.approved_members || 0;
      c.pending_enrollments = c.pending_enrollments || 0;
    });
    res.json({ code: 200, data: clubs });
  } catch (err) {
    logger.error('获取社团列表失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const club = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.club_id = c.id AND e.status = 'pending') as pending_enrollments,
        (SELECT COUNT(*) FROM members m WHERE m.club_id = c.id) as approved_members
      FROM clubs c WHERE c.id = ?
    `).get(req.params.id);
    if (!club) {
      return res.json({ code: 404, message: '社团不存在' });
    }
    club.approved_members = club.approved_members || 0;
    club.pending_enrollments = club.pending_enrollments || 0;
    const news = db.prepare('SELECT * FROM news WHERE club_id = ? AND status = 1 ORDER BY created_at DESC LIMIT 5').all(req.params.id);
    const activities = db.prepare('SELECT * FROM activities WHERE club_id = ? AND status = 1 ORDER BY created_at DESC LIMIT 5').all(req.params.id);
    const members = db.prepare(`
      SELECT u.id, u.real_name, u.avatar, m.position
      FROM members m
      JOIN users u ON m.user_id = u.id
      WHERE m.club_id = ?
      ORDER BY m.join_date DESC
    `).all(req.params.id);
    res.json({ code: 200, data: { ...club, news, activities, members } });
  } catch (err) {
    logger.error('获取社团详情失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.post('/', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, logo, description, banner, max_members, president, contact_phone } = req.body;
  if (!name) return res.json({ code: 400, message: '社团名称必填' });
  try {
    const info = db.prepare('INSERT INTO clubs (name, logo, description, banner, max_members, president, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?)').run(name, logo || '', description || '', banner || '', max_members || 50, president || '', contact_phone || '');
    logger.info('创建社团:', { id: info.lastInsertRowid, name });
    res.json({ code: 200, message: '创建成功', data: { id: info.lastInsertRowid } });
  } catch (err) {
    logger.error('创建社团失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.put('/:id', authMiddleware, requireRole('admin', 'officer'), (req, res) => {
  const { name, logo, description, banner, max_members, president, contact_phone, status } = req.body;
  try {
    db.prepare('UPDATE clubs SET name = COALESCE(?, name), logo = COALESCE(?, logo), description = COALESCE(?, description), banner = COALESCE(?, banner), max_members = COALESCE(?, max_members), president = COALESCE(?, president), contact_phone = COALESCE(?, contact_phone), status = COALESCE(?, status) WHERE id = ?').run(name, logo, description, banner, max_members, president, contact_phone, status, req.params.id);
    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    logger.error('更新社团失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.post('/:id/leave', authMiddleware, (req, res) => {
  const tx = db.transaction(() => {
    const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(req.params.id);
    if (!club) throw new Error('社团不存在');
    const member = db.prepare('SELECT * FROM members WHERE club_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!member) throw new Error('您不是该社团成员');
    db.prepare('DELETE FROM members WHERE club_id = ? AND user_id = ?').run(req.params.id, req.user.id);
    db.prepare('UPDATE clubs SET current_members = MAX(0, current_members - 1) WHERE id = ?').run(req.params.id);
    const hasOther = db.prepare('SELECT COUNT(*) as count FROM members WHERE user_id = ?').get(req.user.id).count;
    if (hasOther === 0) {
      db.prepare('UPDATE users SET club_id = NULL WHERE id = ?').run(req.user.id);
    }
    db.prepare('INSERT INTO notifications (user_id, title, content, type, club_id) VALUES (?, ?, ?, ?, ?)').run(
      req.user.id,
      '退出社团成功',
      `您已成功退出「${club.name}」，期待您的再次加入！`,
      'system',
      club.id
    );
    return { clubName: club.name };
  });
  try {
    const result = tx();
    logger.info('退出社团:', { clubId: req.params.id, clubName: result.clubName, user: req.user.username });
    res.json({ code: 200, message: '退出成功' });
  } catch (err) {
    logger.error('退出社团失败:', err);
    res.json({ code: 400, message: err.message });
  }
});

module.exports = router;
