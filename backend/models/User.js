const db = require('../config/database');

class User {
  static findById(id) {
    return db.prepare(`
      SELECT id, username, email, role, hospital_id, created_at
      FROM users WHERE id = ?
    `).get(id);
  }

  static findByEmail(email) {
    return db.prepare(`
      SELECT * FROM users WHERE email = ? COLLATE NOCASE
    `).get(email);
  }

  static findByUsername(username) {
    return db.prepare(`
      SELECT * FROM users WHERE username = ? COLLATE NOCASE
    `).get(username);
  }

  static create({ username, email, passwordHash, role = 'patient', hospital_id = null }) {
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password, role, hospital_id, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);
    const info = stmt.run(username, email, passwordHash, role, hospital_id);
    return this.findById(info.lastInsertRowid);
  }

  static delete(id) {
    return db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }
}

module.exports = User;
