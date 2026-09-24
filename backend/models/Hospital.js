const db = require('../config/database');

class Hospital {
  static findAll() {
    return db.prepare(`
      SELECT h.*,
        (SELECT COUNT(*) FROM departments d WHERE d.hospital_id = h.id) AS total_departments,
        (SELECT COUNT(*) FROM doctors doc WHERE doc.hospital_id = h.id) AS total_doctors
      FROM hospitals h
      WHERE h.is_active = 1
      ORDER BY h.id ASC
    `).all();
  }

  static findById(id) {
    return db.prepare(`
      SELECT h.*,
        (SELECT COUNT(*) FROM departments d WHERE d.hospital_id = h.id) AS total_departments,
        (SELECT COUNT(*) FROM doctors doc WHERE doc.hospital_id = h.id) AS total_doctors
      FROM hospitals h
      WHERE h.id = ?
    `).get(id);
  }

  static update(id, data) {
    const current = this.findById(id);
    if (!current) return null;

    db.prepare(`
      UPDATE hospitals
      SET name = ?,
          address = ?,
          city = ?,
          type = ?,
          contact_phone = ?,
          email = ?,
          description = ?,
          website = ?,
          opd_timings = ?
      WHERE id = ?
    `).run(
      data.name !== undefined ? data.name : current.name,
      data.address !== undefined ? data.address : current.address,
      data.city !== undefined ? data.city : current.city,
      data.type !== undefined ? data.type : current.type,
      data.contact_phone !== undefined ? data.contact_phone : current.contact_phone,
      data.email !== undefined ? data.email : current.email,
      data.description !== undefined ? data.description : current.description,
      data.website !== undefined ? data.website : current.website,
      data.opd_timings !== undefined ? data.opd_timings : current.opd_timings,
      id
    );

    return this.findById(id);
  }

  static getStats(hospitalId) {
    const today = new Date().toISOString().split('T')[0];

    const totalDoctors = db.prepare(`
      SELECT COUNT(*) as count FROM doctors WHERE hospital_id = ? AND is_active = 1
    `).get(hospitalId).count;

    const totalDepartments = db.prepare(`
      SELECT COUNT(*) as count FROM departments WHERE hospital_id = ?
    `).get(hospitalId).count;

    const todayAppointments = db.prepare(`
      SELECT COUNT(*) as count FROM appointments WHERE hospital_id = ? AND date = ?
    `).get(hospitalId, today).count;

    const pendingRequests = db.prepare(`
      SELECT COUNT(*) as count FROM appointments WHERE hospital_id = ? AND status = 'Pending'
    `).get(hospitalId).count;

    const approvedCount = db.prepare(`
      SELECT COUNT(*) as count FROM appointments WHERE hospital_id = ? AND status = 'Approved'
    `).get(hospitalId).count;

    const cancelledCount = db.prepare(`
      SELECT COUNT(*) as count FROM appointments WHERE hospital_id = ? AND status = 'Cancelled'
    `).get(hospitalId).count;

    const availableSlotsToday = db.prepare(`
      SELECT COUNT(*) as count 
      FROM time_slots ts
      JOIN doctors d ON ts.doctor_id = d.id
      WHERE d.hospital_id = ? AND ts.date = ? AND ts.status = 'AVAILABLE'
    `).get(hospitalId, today).count;

    return {
      totalDoctors,
      totalDepartments,
      todayAppointments,
      pendingRequests,
      approvedCount,
      cancelledCount,
      availableSlotsToday
    };
  }
}

module.exports = Hospital;
