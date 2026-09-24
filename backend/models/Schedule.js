const db = require('../config/database');

class Schedule {
  static findByDoctor(doctorId) {
    return db.prepare(`
      SELECT s.*, d.name as doctor_name
      FROM doctor_schedules s
      JOIN doctors d ON s.doctor_id = d.id
      WHERE s.doctor_id = ?
      ORDER BY s.day_of_week ASC
    `).all(doctorId);
  }

  static findById(id) {
    return db.prepare(`
      SELECT s.*, d.name as doctor_name
      FROM doctor_schedules s
      JOIN doctors d ON s.doctor_id = d.id
      WHERE s.id = ?
    `).get(id);
  }

  static create({ doctor_id, day_of_week, start_time, end_time, slot_duration_minutes = 30, max_patients = 12 }) {
    const stmt = db.prepare(`
      INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, max_patients, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    const info = stmt.run(doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, max_patients);
    return this.findById(info.lastInsertRowid);
  }

  static update(id, data) {
    const current = this.findById(id);
    if (!current) return null;

    db.prepare(`
      UPDATE doctor_schedules
      SET day_of_week = ?,
          start_time = ?,
          end_time = ?,
          slot_duration_minutes = ?,
          max_patients = ?,
          is_active = ?
      WHERE id = ?
    `).run(
      data.day_of_week !== undefined ? data.day_of_week : current.day_of_week,
      data.start_time !== undefined ? data.start_time : current.start_time,
      data.end_time !== undefined ? data.end_time : current.end_time,
      data.slot_duration_minutes !== undefined ? data.slot_duration_minutes : current.slot_duration_minutes,
      data.max_patients !== undefined ? data.max_patients : current.max_patients,
      data.is_active !== undefined ? data.is_active : current.is_active,
      id
    );

    return this.findById(id);
  }

  static delete(id) {
    const current = this.findById(id);
    if (!current) return false;
    db.prepare('DELETE FROM doctor_schedules WHERE id = ?').run(id);
    return true;
  }
}

module.exports = Schedule;
