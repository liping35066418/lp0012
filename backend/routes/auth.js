const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const logger = require('../logger');
const { JWT_SECRET, TOKEN_EXPIRES_IN } = require('../config');
const { authMiddleware } = require('../middleware');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ code: 400, message: '请输入用户名和密码' });
  }
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || user.status !== 1) {
      return res.json({ code: 400, message: '用户不存在或已被禁用' });
    }
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.json({ code: 400, message: '密码错误' });
    }
    const token = jwt.sign({
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      role: user.role,
      club_id: user.club_id
    }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

    delete user.password;
    logger.info('用户登录成功:', { username });
    res.json({ code: 200, message: '登录成功', data: { token, user } });
  } catch (err) {
    logger.error('登录失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.post('/register', (req, res) => {
  const { username, password, real_name, phone, email } = req.body;
  if (!username || !password || !real_name) {
    return res.json({ code: 400, message: '请填写必填项' });
  }
  try {
    const exists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get(username);
    if (exists.count > 0) {
      return res.json({ code: 400, message: '用户名已存在' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare('INSERT INTO users (username, password, real_name, phone, email, role) VALUES (?, ?, ?, ?, ?, ?)').run(username, hash, real_name, phone || '', email || '', 'member');
    logger.info('用户注册成功:', { id: info.lastInsertRowid, username });
    res.json({ code: 200, message: '注册成功' });
  } catch (err) {
    logger.error('注册失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.get('/profile', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, real_name, phone, email, role, club_id, avatar, created_at, status FROM users WHERE id = ?').get(req.user.id);
    const clubs = user.club_id ? db.prepare('SELECT * FROM clubs WHERE id = ?').get(user.club_id) : null;
    res.json({ code: 200, data: { ...user, club: clubs } });
  } catch (err) {
    logger.error('获取用户信息失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.put('/profile', authMiddleware, (req, res) => {
  const { real_name, phone, email, avatar } = req.body;
  try {
    db.prepare('UPDATE users SET real_name = COALESCE(?, real_name), phone = COALESCE(?, phone), email = COALESCE(?, email), avatar = COALESCE(?, avatar) WHERE id = ?').run(real_name, phone, email, avatar, req.user.id);
    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    logger.error('更新用户信息失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
