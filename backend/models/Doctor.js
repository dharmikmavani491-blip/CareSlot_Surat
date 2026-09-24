const db = require('../config/database');

class Doctor {
  static findAll({ hospital_id = null, department_id = null, search = null } = {}) {
    let sql = `
      SELECT doc.*, 
        h.name AS hospital_name,
        d.name AS department_name,
        COALESCE(ROUND(AVG(r.rating), 1), 4.8) AS avg_rating,
        COUNT(r.id) AS review_count
      FROM doctors doc
      JOIN hospitals h ON doc.hospital_id = h.id
      JOIN departments d ON doc.department_id = d.id
      LEFT JOIN doctor_reviews r ON doc.id = r.doctor_id
      WHERE doc.is_active = 1
    `;
    const params = [];
    if (hospital_id) {
      sql += ' AND doc.hospital_id = ?';
      params.push(hospital_id);
    }
    if (department_id) {
      sql += ' AND doc.department_id = ?';
      params.push(department_id);
    }
    if (search) {
      sql += ' AND (doc.name LIKE ? OR doc.specialization LIKE ? OR doc.qualification LIKE ? OR d.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' GROUP BY doc.id ORDER BY doc.id ASC';
    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    return db.prepare(`
      SELECT doc.*, 
        h.name AS hospital_name,
        d.name AS department_name,
        COALESCE(ROUND(AVG(r.rating), 1), 4.8) AS avg_rating,
        COUNT(r.id) AS review_count
      FROM doctors doc
      JOIN hospitals h ON doc.hospital_id = h.id
      JOIN departments d ON doc.department_id = d.id
      LEFT JOIN doctor_reviews r ON doc.id = r.doctor_id
      WHERE doc.id = ?
      GROUP BY doc.id
    `).get(id);
  }

  static create({
    hospital_id,
    department_id,
    name,
    qualification,
    specialization,
    experience_years = 1,
    consultation_fee = 500,
    bio = '',
    opd_timing = '09:00 AM - 01:00 PM',
    room_number = 'Room 101',
    is_active = 1
  }) {
    const stmt = db.prepare(`
      INSERT INTO doctors (
        hospital_id, department_id, name, qualification, specialization,
        experience_years, consultation_fee, bio, opd_timing, room_number, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    const info = stmt.run(
      hospital_id,
      department_id,
      name,
      qualification,
      specialization,
      experience_years ? parseInt(experience_years) : 1,
      consultation_fee ? parseFloat(consultation_fee) : 500,
      bio || '',
      opd_timing || '09:00 AM - 01:00 PM',
      room_number || 'Room 101',
      is_active !== undefined ? is_active : 1
    );

    const newDocId = info.lastInsertRowid;

    // Create default schedule Mon-Sat for this new doctor
    const insertSched = db.prepare(`
      INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, max_patients, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    for (let day = 1; day <= 6; day++) {
      insertSched.run(newDocId, day, '09:00 AM', '01:00 PM', 30, 8);
    }

    return this.findById(newDocId);
  }

  static update(id, data) {
    const current = this.findById(id);
    if (!current) return null;

    db.prepare(`
      UPDATE doctors
      SET name = ?,
          department_id = ?,
          qualification = ?,
          specialization = ?,
          experience_years = ?,
          consultation_fee = ?,
          bio = ?,
          opd_timing = ?,
          room_number = ?,
          is_active = ?
      WHERE id = ?
    `).run(
      data.name !== undefined ? data.name : current.name,
      data.department_id !== undefined ? data.department_id : current.department_id,
      data.qualification !== undefined ? data.qualification : current.qualification,
      data.specialization !== undefined ? data.specialization : current.specialization,
      data.experience_years !== undefined ? parseInt(data.experience_years) : current.experience_years,
      data.consultation_fee !== undefined ? parseFloat(data.consultation_fee) : current.consultation_fee,
      data.bio !== undefined ? data.bio : current.bio,
      data.opd_timing !== undefined ? data.opd_timing : current.opd_timing,
      data.room_number !== undefined ? data.room_number : current.room_number,
      data.is_active !== undefined ? data.is_active : current.is_active,
      id
    );

    return this.findById(id);
  }

  static delete(id) {
    const current = this.findById(id);
    if (!current) return false;
    db.prepare('DELETE FROM doctors WHERE id = ?').run(id);
    return true;
  }
}

module.exports = Doctor;
