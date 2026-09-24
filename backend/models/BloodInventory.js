const db = require('../config/database');

class BloodInventory {
  static findAll({ hospital_id = null, blood_group = null, status = null } = {}) {
    let sql = `
      SELECT b.*, h.name AS hospital_name, h.address AS hospital_address, h.contact_phone AS hospital_contact_phone
      FROM blood_inventory b
      JOIN hospitals h ON b.hospital_id = h.id
      WHERE 1=1
    `;
    const params = [];

    if (hospital_id) {
      sql += ' AND b.hospital_id = ?';
      params.push(hospital_id);
    }
    if (blood_group) {
      sql += ' AND b.blood_group = ?';
      params.push(blood_group);
    }
    if (status) {
      sql += ' AND b.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY b.blood_group ASC, b.units_available DESC';
    return db.prepare(sql).all(...params);
  }

  static getSummary() {
    const summary = db.prepare(`
      SELECT 
        COUNT(DISTINCT hospital_id) AS total_blood_banks,
        SUM(units_available) AS total_units_available,
        SUM(CASE WHEN blood_group = 'A+' THEN units_available ELSE 0 END) AS units_a_pos,
        SUM(CASE WHEN blood_group = 'A-' THEN units_available ELSE 0 END) AS units_a_neg,
        SUM(CASE WHEN blood_group = 'B+' THEN units_available ELSE 0 END) AS units_b_pos,
        SUM(CASE WHEN blood_group = 'B-' THEN units_available ELSE 0 END) AS units_b_neg,
        SUM(CASE WHEN blood_group = 'O+' THEN units_available ELSE 0 END) AS units_o_pos,
        SUM(CASE WHEN blood_group = 'O-' THEN units_available ELSE 0 END) AS units_o_neg,
        SUM(CASE WHEN blood_group = 'AB+' THEN units_available ELSE 0 END) AS units_ab_pos,
        SUM(CASE WHEN blood_group = 'AB-' THEN units_available ELSE 0 END) AS units_ab_neg
      FROM blood_inventory
    `).get();

    return summary;
  }
}

module.exports = BloodInventory;
