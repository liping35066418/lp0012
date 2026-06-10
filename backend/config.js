const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
const LOG_DIR = path.join(__dirname, 'logs');
const DB_PATH = path.join(DATA_DIR, 'club.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

module.exports = {
  PORT: 8612,
  JWT_SECRET: 'club-system-secret-key-2024',
  TOKEN_EXPIRES_IN: '24h',
  DB_PATH,
  LOG_DIR,
  DATA_DIR
};
