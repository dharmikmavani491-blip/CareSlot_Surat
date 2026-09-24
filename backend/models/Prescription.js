const db = require('../config/database');

class Prescription {
  static findByAppointmentId(appointmentId) {
    const sql = `
      SELECT p.*,
        h.name AS hospital_name,
        h.address AS hospital_address,
        h.contact_phone AS hospital_contact_phone,
        h.type AS hospital_type,
        doc.name AS doctor_name,
        doc.specialization AS doctor_specialization,
        doc.qualification AS doctor_qualification,
        doc.room_number AS doctor_room_number,
        dept.name AS department_name,
        pat.full_name AS patient_name,
        pat.age AS patient_age,
        pat.gender AS patient_gender,
        pat.contact AS patient_contact,
        apt.appointment_number,
        apt.date AS appointment_date,
        apt.time_slot AS appointment_time
      FROM prescriptions p
      JOIN appointments apt ON p.appointment_id = apt.appointment_id
      JOIN hospitals h ON p.hospital_id = h.id
      JOIN doctors doc ON p.doctor_id = doc.id
      JOIN departments dept ON doc.department_id = dept.id
      JOIN patients pat ON p.patient_id = pat.id
      WHERE p.appointment_id = ?
    `;
    const row = db.prepare(sql).get(appointmentId);
    if (!row) return null;
    try {
      row.medications = JSON.parse(row.medications_json || '[]');
    } catch (e) {
      row.medications = [];
    }
    return row;
  }

  static findAllByPatient(patientId) {
    const sql = `
      SELECT p.*,
        h.name AS hospital_name,
        h.address AS hospital_address,
        doc.name AS doctor_name,
        doc.specialization AS doctor_specialization,
        pat.full_name AS patient_name,
        apt.appointment_number,
        apt.date AS appointment_date
      FROM prescriptions p
      JOIN appointments apt ON p.appointment_id = apt.appointment_id
      JOIN hospitals h ON p.hospital_id = h.id
      JOIN doctors doc ON p.doctor_id = doc.id
      JOIN patients pat ON p.patient_id = pat.id
      WHERE p.patient_id = ?
      ORDER BY p.id DESC
    `;
    const rows = db.prepare(sql).all(patientId);
    return rows.map(r => {
      try {
        r.medications = JSON.parse(r.medications_json || '[]');
      } catch (e) {
        r.medications = [];
      }
      return r;
    });
  }

  static findById(id) {
    const sql = `
      SELECT p.*,
        h.name AS hospital_name,
        h.address AS hospital_address,
        h.contact_phone AS hospital_contact_phone,
        h.type AS hospital_type,
        doc.name AS doctor_name,
        doc.specialization AS doctor_specialization,
        doc.qualification AS doctor_qualification,
        dept.name AS department_name,
        pat.full_name AS patient_name,
        pat.age AS patient_age,
        pat.gender AS patient_gender,
        pat.contact AS patient_contact,
        apt.appointment_number,
        apt.date AS appointment_date,
        apt.time_slot AS appointment_time
      FROM prescriptions p
      JOIN appointments apt ON p.appointment_id = apt.appointment_id
      JOIN hospitals h ON p.hospital_id = h.id
      JOIN doctors doc ON p.doctor_id = doc.id
      JOIN departments dept ON doc.department_id = dept.id
      JOIN patients pat ON p.patient_id = pat.id
      WHERE p.id = ?
    `;
    const row = db.prepare(sql).get(id);
    if (!row) return null;
    try {
      row.medications = JSON.parse(row.medications_json || '[]');
    } catch (e) {
      row.medications = [];
    }
    return row;
  }
}

module.exports = Prescription;
