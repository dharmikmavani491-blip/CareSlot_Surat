const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/database');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No authentication token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid token format.'
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = db.prepare(`
      SELECT id, username, email, role, hospital_id, created_at
      FROM users WHERE id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Session invalid. User no longer exists.'
      });
    }

    req.user = user;

    // Attach patient record if patient
    if (user.role === 'patient') {
      const patient = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(user.id);
      req.patient = patient || null;
    }

    // Attach hospital record if hospital staff/admin
    if (user.role === 'hospital' && user.hospital_id) {
      const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(user.hospital_id);
      req.hospital = hospital || null;
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication token has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token.'
    });
  }
}

// Optional auth: populates req.user if token valid, but does not block if absent
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = db.prepare(`
        SELECT id, username, email, role, hospital_id, created_at
        FROM users WHERE id = ?
      `).get(decoded.id);
      if (user) {
        req.user = user;
        if (user.role === 'patient') {
          req.patient = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(user.id);
        }
        if (user.role === 'hospital' && user.hospital_id) {
          req.hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(user.hospital_id);
        }
      }
    }
  } catch (e) {
    // Ignore invalid tokens for optional auth
  }
  next();
}

module.exports = {
  authMiddleware,
  optionalAuth
};
