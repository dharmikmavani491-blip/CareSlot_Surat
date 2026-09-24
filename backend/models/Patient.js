const db = require('../config/database');

class Patient {
  static findAll() {
    return db.prepare(`
      SELECT p.*, u.email, u.username
      FROM patients p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.id ASC
    `).all();
  }

  static findById(id) {
    return db.prepare(`
      SELECT p.*, u.email, u.username
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(id);
  }

  static findByUserId(userId) {
    return db.prepare(`
      SELECT p.*, u.email, u.username
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
    `).get(userId);
  }

  static create({ user_id, full_name, age, gender, contact, address, medical_history }) {
    const stmt = db.prepare(`
      INSERT INTO patients (user_id, full_name, age, gender, contact, address, medical_history, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    const info = stmt.run(
      user_id,
      full_name,
      age ? parseInt(age) : null,
      gender || 'Other',
      contact,
      address || '',
      medical_history || ''
    );
    return this.findById(info.lastInsertRowid);
  }

  static update(id, { full_name, age, gender, contact, address, medical_history }) {
    const current = this.findById(id);
    if (!current) return null;

    db.prepare(`
      UPDATE patients
      SET full_name = ?,
          age = ?,
          gender = ?,
          contact = ?,
          address = ?,
          medical_history = ?
      WHERE id = ?
    `).run(
      full_name !== undefined ? full_name : current.full_name,
      age !== undefined ? parseInt(age) : current.age,
      gender !== undefined ? gender : current.gender,
      contact !== undefined ? contact : current.contact,
      address !== undefined ? address : current.address,
      medical_history !== undefined ? medical_history : current.medical_history,
      id
    );

    return this.findById(id);
  }

  static delete(id) {
    const patient = this.findById(id);
    if (!patient) return false;
    // Deleting user will cascade to patient, or delete patient directly
    db.prepare('DELETE FROM patients WHERE id = ?').run(id);
    return true;
  }
}

module.exports = Patient;
