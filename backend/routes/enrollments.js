const express = require('express');
const router = express.Router();
const db = require('../database');
const logger = require('../logger');
const { authMiddleware, requireRole } = require('../middleware');

router.post('/', authMiddleware, (req, res) => {
  const { club_id, real_name, gender, student_id, phone, email, department, grade, reason, skills } = req.body;
  if (!club_id || !real_name) {
    return res.json({ code: 400, message: '请填写必填项' });
  }
  const tx = db.transaction(() => {
    const club = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.club_id = c.id AND e.status = 'pending') as pending_enrollments,
        (SELECT COUNT(*) FROM members m WHERE m.club_id = c.id) as approved_members
      FROM clubs c WHERE c.id = ?
    `).get(club_id);
    if (!club) throw new Error('社团不存在');
    const approved = club.approved_members || 0;
    const pending = club.pending_enrollments || 0;
    if (approved + pending >= club.max_members) {
      throw new Error('名额已被占满，请等待审核结果');
    }
    if (req.user) {
      const pending = db.prepare('SELECT COUNT(*) as count FROM enrollments WHERE club_id = ? AND user_id = ? AND status = ?').get(club_id, req.user.id, 'pending');
      if (pending.count > 0) throw new Error('您已报名过该社团，请等待审核结果');
      const isMember = db.prepare('SELECT COUNT(*) as count FROM members WHERE club_id = ? AND user_id = ?').get(club_id, req.user.id);
      if (isMember.count > 0) throw new Error('您已是该社团成员');
    }
    const info = db.prepare(`INSERT INTO enrollments 
      (user_id, club_id, real_name, gender, student_id, phone, email, department, grade, reason, skills) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        req.user?.id || null, club_id, real_name, gender || '', student_id || '', phone || '', email || '', department || '', grade || '', reason || '', skills || ''
      );
    db.prepare('INSERT INTO notifications (user_id, title, content, type, club_id) VALUES (?, ?, ?, ?, ?)').run(
      req.user?.id || null, '报名提交成功', `您已成功提交「${club.name}」的报名申请，请等待审核`, 'system', club_id
    );
    return { id: info.lastInsertRowid, clubName: club.name };
  });
  try {
    const result = tx();
    logger.info('社团报名提交:', { id: result.id, clubName: result.clubName, user: req.user?.username });
    res.json({ code: 200, message: '报名提交成功', data: result });
  } catch (err) {
    logger.error('报名失败:', err);
    res.json({ code: 400, message: err.message });
  }
});

router.get('/my', authMiddleware, (req, res) => {
  try {
    const list = db.prepare(`
      SELECT e.*, c.name as club_name, c.logo as club_logo, c.max_members
      FROM enrollments e
      JOIN clubs c ON e.club_id = c.id
      WHERE e.user_id = ?
      ORDER BY e.created_at DESC
    `).all(req.user.id);
    res.json({ code: 200, data: list });
  } catch (err) {
    logger.error('获取我的报名失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.get('/', authMiddleware, requireRole('admin', 'officer'), (req, res) => {
  const { club_id, status, keyword } = req.query;
  let sql = `SELECT e.*, c.name as club_name, u.username FROM enrollments e JOIN clubs c ON e.club_id = c.id LEFT JOIN users u ON e.user_id = u.id WHERE 1=1`;
  const params = [];
  if (club_id) { sql += ' AND e.club_id = ?'; params.push(club_id); }
  if (status) { sql += ' AND e.status = ?'; params.push(status); }
  if (keyword) { sql += ' AND (e.real_name LIKE ? OR e.student_id LIKE ? OR e.phone LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  sql += ' ORDER BY e.created_at DESC';
  try {
    const list = db.prepare(sql).all(...params);
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM enrollments ${club_id ? 'WHERE club_id = ' + club_id : ''}
    `).get();
    res.json({ code: 200, data: { list, stats } });
  } catch (err) {
    logger.error('获取报名列表失败:', err);
    res.json({ code: 500, message: '服务器错误' });
  }
});

router.post('/:id/review', authMiddleware, requireRole('admin', 'officer'), (req, res) => {
  const { status, review_note } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.json({ code: 400, message: '审核状态无效' });
  }
  const tx = db.transaction(() => {
    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(req.params.id);
    if (!enrollment) throw new Error('报名记录不存在');
    if (enrollment.status !== 'pending') throw new Error('该报名已被处理');
    const club = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM members m WHERE m.club_id = c.id) as approved_members
      FROM clubs c WHERE c.id = ?
    `).get(enrollment.club_id);
    if (status === 'approved') {
      const approved = club.approved_members || 0;
      if (approved >= club.max_members) {
        throw new Error('社团人数已达上限，无法通过审核');
      }
      db.prepare('UPDATE clubs SET current_members = current_members + 1 WHERE id = ?').run(enrollment.club_id);
      if (enrollment.user_id) {
        const exist = db.prepare('SELECT COUNT(*) as count FROM members WHERE user_id = ? AND club_id = ?').get(enrollment.user_id, enrollment.club_id);
        if (exist.count === 0) {
          db.prepare('INSERT INTO members (user_id, club_id) VALUES (?, ?)').run(enrollment.user_id, enrollment.club_id);
        }
        db.prepare('UPDATE users SET club_id = ? WHERE id = ?').run(enrollment.club_id, enrollment.user_id);
      }
    }
    db.prepare(`UPDATE enrollments SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_note = ? WHERE id = ?`).run(status, req.user.id, review_note || '', req.params.id);
    db.prepare('INSERT INTO notifications (user_id, title, content, type, club_id) VALUES (?, ?, ?, ?, ?)').run(
      enrollment.user_id,
      status === 'approved' ? '报名审核通过' : '报名审核未通过',
      status === 'approved'
        ? `恭喜！您申请加入「${club.name}」已通过审核，欢迎加入！${review_note ? '备注：' + review_note : ''}`
        : `很抱歉，您申请加入「${club.name}」未通过审核。${review_note ? '原因：' + review_note : ''}`,
      'review',
      enrollment.club_id
    );
    return { enrollment, club, status };
  });
  try {
    const result = tx();
    logger.info('报名审核完成:', { id: req.params.id, status: result.status, reviewer: req.user.username });
    res.json({ code: 200, message: '审核成功' });
  } catch (err) {
    logger.error('审核失败:', err);
    res.json({ code: 400, message: err.message });
  }
});

module.exports = router;
