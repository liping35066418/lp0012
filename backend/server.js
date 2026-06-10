const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const { PORT } = require('./config');
require('./database');

const app = express();

app.use(cors({ origin: /^http:\/\/(localhost|127\.0\.0\.1|198\.18\.0\.1):\d+$/, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, { ip: req.ip, body: Object.keys(req.body).length > 0 ? 'has_body' : undefined });
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clubs', require('./routes/clubs'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/news', require('./routes/news'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/members', require('./routes/members'));

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: '社团管理系统后端服务运行中', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  logger.error('未处理的异常:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误', error: err.message });
});

app.listen(PORT, () => {
  logger.info(`服务器启动成功，监听端口: ${PORT}`);
  logger.info(`API地址: http://localhost:${PORT}/api`);
  logger.info(`健康检查: http://localhost:${PORT}/api/health`);
});

process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', { reason: reason?.message, promise: String(promise) });
});
