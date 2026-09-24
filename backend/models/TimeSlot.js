const db = require('../config/database');

class TimeSlot {
  static findAll({ doctor_id = null, date = null, status = null } = {}) {
    let sql = `
      SELECT ts.*, 
        d.name AS doctor_name, 
        d.specialization,
        h.name AS hospital_name,
        dept.name AS department_name
      FROM time_slots ts
      JOIN doctors d ON ts.doctor_id = d.id
      JOIN hospitals h ON d.hospital_id = h.id
      JOIN departments dept ON d.department_id = dept.id
      WHERE 1=1
    `;
    const params = [];

    if (doctor_id) {
      sql += ' AND ts.doctor_id = ?';
      params.push(doctor_id);
    }
    if (date) {
      sql += ' AND ts.date = ?';
      params.push(date);
    }
    if (status) {
      sql += ' AND ts.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY ts.date ASC, ts.start_time ASC';
    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    return db.prepare(`
      SELECT ts.*, 
        d.name AS doctor_name,
        d.specialization,
        h.name AS hospital_name,
        dept.name AS department_name
      FROM time_slots ts
      JOIN doctors d ON ts.doctor_id = d.id
      JOIN hospitals h ON d.hospital_id = h.id
      JOIN departments dept ON d.department_id = dept.id
      WHERE ts.id = ?
    `).get(id);
  }

  static create({ doctor_id, date, start_time, end_time, status = 'AVAILABLE', schedule_id = null }) {
    const stmt = db.prepare(`
      INSERT INTO time_slots (doctor_id, schedule_id, date, start_time, end_time, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    const info = stmt.run(doctor_id, schedule_id, date, start_time, end_time, status);
    return this.findById(info.lastInsertRowid);
  }

  static update(id, { date, start_time, end_time, status }) {
    const current = this.findById(id);
    if (!current) return null;

    db.prepare(`
      UPDATE time_slots
      SET date = ?,
          start_time = ?,
          end_time = ?,
          status = ?
      WHERE id = ?
    `).run(
      date !== undefined ? date : current.date,
      start_time !== undefined ? start_time : current.start_time,
      end_time !== undefined ? end_time : current.end_time,
      status !== undefined ? status : current.status,
      id
    );

    return this.findById(id);
  }

  static delete(id) {
    const current = this.findById(id);
    if (!current) return false;
    db.prepare('DELETE FROM time_slots WHERE id = ?').run(id);
    return true;
  }

  // Section 4 requirement: Get doctor schedule for specific date,
  // showing Available slots, Booked slots with demo patient details if booked!
  static getScheduleForDoctorDate(doctorId, date) {
    // 1. Ensure slots exist for this doctor and date; if empty, create standard OPD slots
    const existing = db.prepare(`
      SELECT COUNT(*) as count FROM time_slots WHERE doctor_id = ? AND date = ?
    `).get(doctorId, date).count;

    if (existing === 0) {
      const defaultSlots = [
        ['09:00 AM', '09:30 AM'],
        ['09:30 AM', '10:00 AM'],
        ['10:00 AM', '10:30 AM'],
        ['10:30 AM', '11:00 AM'],
        ['11:00 AM', '11:30 AM'],
        ['11:30 AM', '12:00 PM'],
        ['12:00 PM', '12:30 PM'],
        ['12:30 PM', '01:00 PM'],
        ['02:00 PM', '02:30 PM'],
        ['02:30 PM', '03:00 PM']
      ];
      const insert = db.prepare(`
        INSERT OR IGNORE INTO time_slots (doctor_id, date, start_time, end_time, status)
        VALUES (?, ?, ?, ?, 'AVAILABLE')
      `);
      defaultSlots.forEach(([s, e]) => insert.run(doctorId, date, s, e));
    }

    // 2. Fetch slots and join with active appointments & synthetic patient info
    const slots = db.prepare(`
      SELECT 
        ts.id AS slot_id,
        ts.doctor_id,
        ts.date,
        ts.start_time,
        ts.end_time,
        ts.status,
        apt.appointment_id,
        apt.appointment_number,
        apt.status AS appointment_status,
        apt.reason AS appointment_reason,
        p.id AS patient_id,
        p.full_name AS patient_name,
        p.age AS patient_age,
        p.gender AS patient_gender,
        p.contact AS patient_contact
      FROM time_slots ts
      LEFT JOIN appointments apt ON (
        (apt.slot_id = ts.id OR (apt.doctor_id = ts.doctor_id AND apt.date = ts.date AND apt.time_slot = ts.start_time))
        AND apt.status IN ('Approved', 'Pending')
      )
      LEFT JOIN patients p ON apt.patient_id = p.id
      WHERE ts.doctor_id = ? AND ts.date = ?
      ORDER BY ts.start_time ASC
    `).all(doctorId, date);

    return slots;
  }
}

module.exports = TimeSlot;
