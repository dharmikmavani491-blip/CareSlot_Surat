const db = require('../config/database');

class DoctorReview {
  static findByDoctor(doctorId) {
    const sql = `
      SELECT rev.*, doc.name AS doctor_name, doc.specialization
      FROM doctor_reviews rev
      JOIN doctors doc ON rev.doctor_id = doc.id
      WHERE rev.doctor_id = ?
      ORDER BY rev.created_at DESC
    `;
    return db.prepare(sql).all(doctorId);
  }

  static findAll(limit = 10) {
    const sql = `
      SELECT rev.*, doc.name AS doctor_name, doc.specialization, h.name AS hospital_name
      FROM doctor_reviews rev
      JOIN doctors doc ON rev.doctor_id = doc.id
      JOIN hospitals h ON doc.hospital_id = h.id
      ORDER BY rev.created_at DESC
      LIMIT ?
    `;
    return db.prepare(sql).all(limit);
  }

  static create({ doctor_id, patient_id, appointment_id = null, rating, wait_time_rating = 5, comment, patient_display_name }) {
    const info = db.prepare(`
      INSERT INTO doctor_reviews (doctor_id, patient_id, appointment_id, rating, wait_time_rating, comment, patient_display_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(doctor_id, patient_id, appointment_id, rating, wait_time_rating, comment, patient_display_name);

    return db.prepare('SELECT * FROM doctor_reviews WHERE id = ?').get(info.lastInsertRowid);
  }
}

module.exports = DoctorReview;
