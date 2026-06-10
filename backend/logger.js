const { createLogger, format, transports } = require('winston');
const { LOG_DIR } = require('./config');
const path = require('path');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'club-backend' },
  transports: [
    new transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(LOG_DIR, 'combined.log') })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
      })
    )
  }));
}

module.exports = logger;
