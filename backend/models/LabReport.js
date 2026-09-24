const db = require('../config/database');

class LabReport {
  static findAll({ patient_id = null, hospital_id = null } = {}) {
    let sql = `
      SELECT r.*,
        h.name AS hospital_name,
        h.address AS hospital_address,
        h.contact_phone AS hospital_contact_phone,
        doc.name AS doctor_name,
        doc.specialization AS doctor_specialization,
        p.full_name AS patient_name,
        p.age AS patient_age,
        p.gender AS patient_gender,
        p.contact AS patient_contact
      FROM lab_reports r
      JOIN hospitals h ON r.hospital_id = h.id
      JOIN patients p ON r.patient_id = p.id
      LEFT JOIN doctors doc ON r.doctor_id = doc.id
      WHERE 1=1
    `;
    const params = [];

    if (patient_id) {
      sql += ' AND r.patient_id = ?';
      params.push(patient_id);
    }
    if (hospital_id) {
      sql += ' AND r.hospital_id = ?';
      params.push(hospital_id);
    }

    sql += ' ORDER BY r.report_date DESC, r.id DESC';
    const rows = db.prepare(sql).all(...params);

    // Parse JSON metrics
    return rows.map(r => {
      try {
        r.metrics = JSON.parse(r.detailed_metrics || '[]');
      } catch (e) {
        r.metrics = [];
      }
      return r;
    });
  }

  static findById(id) {
    const sql = `
      SELECT r.*,
        h.name AS hospital_name,
        h.address AS hospital_address,
        h.contact_phone AS hospital_contact_phone,
        doc.name AS doctor_name,
        doc.specialization AS doctor_specialization,
        p.full_name AS patient_name,
        p.age AS patient_age,
        p.gender AS patient_gender,
        p.contact AS patient_contact
      FROM lab_reports r
      JOIN hospitals h ON r.hospital_id = h.id
      JOIN patients p ON r.patient_id = p.id
      LEFT JOIN doctors doc ON r.doctor_id = doc.id
      WHERE r.id = ?
    `;
    const r = db.prepare(sql).get(id);
    if (!r) return null;
    try {
      r.metrics = JSON.parse(r.detailed_metrics || '[]');
    } catch (e) {
      r.metrics = [];
    }
    return r;
  }
}

module.exports = LabReport;
