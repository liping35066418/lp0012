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
    const clubs = db.prepare('SELECT * FROM clubs WHERE status = 1 ORDER BY id ASC').all();
    res.json({ code: 200, data: clubs });
  } catch (err) {
    logger.error('获取社团列表失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(req.params.id);
    if (!club) {
      return res.json({ code: 404, message: '社团不存在' });
    }
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

module.exports = router;
