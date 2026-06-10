const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');
const logger = require('./logger');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录，请先登录' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('Token验证失败:', err.message);
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
