require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'wad-pbl-activity-2-super-secret-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || path.join(__dirname, '../database/hospital_system.sqlite'),
  env: process.env.NODE_ENV || 'development'
};
