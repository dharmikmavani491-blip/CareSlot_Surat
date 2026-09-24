const db = require('../config/database');

class HospitalBed {
  static findAll({ hospital_id = null, bed_type = null } = {}) {
    let sql = `
      SELECT b.*, h.name AS hospital_name, h.address AS hospital_address, h.contact_phone AS hospital_contact_phone
      FROM hospital_beds b
      JOIN hospitals h ON b.hospital_id = h.id
      WHERE 1=1
    `;
    const params = [];

    if (hospital_id) {
      sql += ' AND b.hospital_id = ?';
      params.push(hospital_id);
    }
    if (bed_type) {
      sql += ' AND b.bed_type LIKE ?';
      params.push(`%${bed_type}%`);
    }

    sql += ' ORDER BY b.hospital_id ASC, b.available DESC';
    return db.prepare(sql).all(...params);
  }

  static getSummary() {
    const summary = db.prepare(`
      SELECT 
        COUNT(DISTINCT hospital_id) AS total_hospitals,
        SUM(total_capacity) AS total_beds,
        SUM(occupied) AS total_occupied,
        SUM(available) AS total_available,
        SUM(CASE WHEN bed_type LIKE '%ICU%' THEN available ELSE 0 END) AS available_icu,
        SUM(CASE WHEN bed_type LIKE '%Oxygen%' THEN available ELSE 0 END) AS available_oxygen,
        SUM(CASE WHEN bed_type LIKE '%Trauma%' THEN available ELSE 0 END) AS available_trauma
      FROM hospital_beds
    `).get();

    return summary;
  }
}

module.exports = HospitalBed;
