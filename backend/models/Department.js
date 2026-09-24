const db = require('../config/database');

class Department {
  static findAll(hospitalId = null) {
    let sql = `
      SELECT d.*, h.name as hospital_name,
        (SELECT COUNT(*) FROM doctors doc WHERE doc.department_id = d.id AND doc.is_active = 1) AS total_doctors
      FROM departments d
      JOIN hospitals h ON d.hospital_id = h.id
    `;
    const params = [];
    if (hospitalId) {
      sql += ' WHERE d.hospital_id = ?';
      params.push(hospitalId);
    }
    sql += ' ORDER BY d.id ASC';
    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    return db.prepare(`
      SELECT d.*, h.name as hospital_name,
        (SELECT COUNT(*) FROM doctors doc WHERE doc.department_id = d.id AND doc.is_active = 1) AS total_doctors
      FROM departments d
      JOIN hospitals h ON d.hospital_id = h.id
      WHERE d.id = ?
    `).get(id);
  }

  static create({ hospital_id, name, description, icon = 'activity' }) {
    const stmt = db.prepare(`
      INSERT INTO departments (hospital_id, name, description, icon, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    const info = stmt.run(hospital_id, name, description || '', icon || 'activity');
    return this.findById(info.lastInsertRowid);
  }

  static update(id, { name, description, icon }) {
    const current = this.findById(id);
    if (!current) return null;

    db.prepare(`
      UPDATE departments
      SET name = ?,
          description = ?,
          icon = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name : current.name,
      description !== undefined ? description : current.description,
      icon !== undefined ? icon : current.icon,
      id
    );

    return this.findById(id);
  }

  static delete(id) {
    const current = this.findById(id);
    if (!current) return false;
    db.prepare('DELETE FROM departments WHERE id = ?').run(id);
    return true;
  }
}

module.exports = Department;
