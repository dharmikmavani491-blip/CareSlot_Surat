const db = require('../config/database');

class Appointment {
  static findAll({
    patient_id = null,
    hospital_id = null,
    doctor_id = null,
    status = null,
    date = null
  } = {}) {
    let sql = `
      SELECT apt.*,
        p.full_name AS patient_name,
        p.age AS patient_age,
        p.gender AS patient_gender,
        p.contact AS patient_contact,
        p.address AS patient_address,
        p.medical_history AS patient_medical_history,
        doc.name AS doctor_name,
        doc.qualification AS doctor_qualification,
        doc.specialization AS doctor_specialization,
        doc.consultation_fee AS doctor_consultation_fee,
        doc.room_number AS doctor_room_number,
        h.name AS hospital_name,
        h.address AS hospital_address,
        h.contact_phone AS hospital_contact_phone,
        dept.name AS department_name
      FROM appointments apt
      JOIN patients p ON apt.patient_id = p.id
      JOIN doctors doc ON apt.doctor_id = doc.id
      JOIN hospitals h ON apt.hospital_id = h.id
      JOIN departments dept ON apt.department_id = dept.id
      WHERE 1=1
    `;
    const params = [];

    if (patient_id) {
      sql += ' AND apt.patient_id = ?';
      params.push(patient_id);
    }
    if (hospital_id) {
      sql += ' AND apt.hospital_id = ?';
      params.push(hospital_id);
    }
    if (doctor_id) {
      sql += ' AND apt.doctor_id = ?';
      params.push(doctor_id);
    }
    if (status) {
      sql += ' AND apt.status = ?';
      params.push(status);
    }
    if (date) {
      sql += ' AND apt.date = ?';
      params.push(date);
    }

    sql += ' ORDER BY apt.date DESC, apt.time_slot DESC, apt.appointment_id DESC';
    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    return db.prepare(`
      SELECT apt.*,
        p.full_name AS patient_name,
        p.age AS patient_age,
        p.gender AS patient_gender,
        p.contact AS patient_contact,
        p.address AS patient_address,
        p.medical_history AS patient_medical_history,
        doc.name AS doctor_name,
        doc.qualification AS doctor_qualification,
        doc.specialization AS doctor_specialization,
        doc.consultation_fee AS doctor_consultation_fee,
        doc.room_number AS doctor_room_number,
        h.name AS hospital_name,
        h.address AS hospital_address,
        h.contact_phone AS hospital_contact_phone,
        dept.name AS department_name
      FROM appointments apt
      JOIN patients p ON apt.patient_id = p.id
      JOIN doctors doc ON apt.doctor_id = doc.id
      JOIN hospitals h ON apt.hospital_id = h.id
      JOIN departments dept ON apt.department_id = dept.id
      WHERE apt.appointment_id = ?
    `).get(id);
  }

  static create({
    patient_id,
    hospital_id,
    doctor_id,
    department_id,
    date,
    time_slot,
    slot_id = null,
    reason,
    symptoms = '',
    notes = ''
  }) {
    // 1. Double Booking Prevention Check
    const activeAppointment = db.prepare(`
      SELECT appointment_id, status FROM appointments
      WHERE doctor_id = ? AND date = ? AND time_slot = ?
      AND status IN ('Pending', 'Approved')
    `).get(doctor_id, date, time_slot);

    if (activeAppointment) {
      const err = new Error(
        `This time slot (${time_slot} on ${date}) is already ${activeAppointment.status.toLowerCase()}. Please select another time slot.`
      );
      err.statusCode = 409;
      throw err;
    }

    // 2. Generate unique appointment number
    const countToday = db.prepare(`
      SELECT COUNT(*) as count FROM appointments WHERE date = ?
    `).get(date).count + 1;
    const cleanDate = date.replace(/-/g, '');
    const appointment_number = `APT-${cleanDate}-${String(countToday).padStart(3, '0')}`;

    // 3. Locate or link time slot
    let resolvedSlotId = slot_id;
    if (!resolvedSlotId) {
      const existingSlot = db.prepare(`
        SELECT id FROM time_slots WHERE doctor_id = ? AND date = ? AND start_time = ?
      `).get(doctor_id, date, time_slot);
      if (existingSlot) {
        resolvedSlotId = existingSlot.id;
      }
    }

    // 4. Insert appointment with status 'Pending'
    const stmt = db.prepare(`
      INSERT INTO appointments (
        appointment_number, patient_id, hospital_id, doctor_id, department_id,
        date, time_slot, slot_id, reason, symptoms, notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', datetime('now'), datetime('now'))
    `);

    const info = stmt.run(
      appointment_number,
      patient_id,
      hospital_id,
      doctor_id,
      department_id,
      date,
      time_slot,
      resolvedSlotId,
      reason,
      symptoms || '',
      notes || ''
    );

    return this.findById(info.lastInsertRowid);
  }

  static update(id, data) {
    const current = this.findById(id);
    if (!current) return null;

    db.prepare(`
      UPDATE appointments
      SET reason = ?,
          symptoms = ?,
          notes = ?,
          updated_at = datetime('now')
      WHERE appointment_id = ?
    `).run(
      data.reason !== undefined ? data.reason : current.reason,
      data.symptoms !== undefined ? data.symptoms : current.symptoms,
      data.notes !== undefined ? data.notes : current.notes,
      id
    );

    return this.findById(id);
  }

  // Hospital or Patient status update with strict workflow rules
  static updateStatus(id, newStatus, rejectionReason = null, notes = null) {
    const current = this.findById(id);
    if (!current) return null;

    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'];
    if (!validStatuses.includes(newStatus)) {
      const err = new Error(`Invalid status: ${newStatus}`);
      err.statusCode = 400;
      throw err;
    }

    // Execute atomic update and slot synchronization
    const updateTx = db.transaction(() => {
      db.prepare(`
        UPDATE appointments
        SET status = ?,
            rejection_reason = ?,
            notes = COALESCE(?, notes),
            updated_at = datetime('now')
        WHERE appointment_id = ?
      `).run(newStatus, rejectionReason || current.rejection_reason, notes, id);

      // Slot status transitions:
      // When Approved -> slot becomes BOOKED
      // When Rejected or Cancelled -> slot becomes AVAILABLE
      // When Completed -> slot remains BOOKED
      if (current.slot_id) {
        if (newStatus === 'Approved') {
          db.prepare("UPDATE time_slots SET status = 'BOOKED' WHERE id = ?").run(current.slot_id);
        } else if (newStatus === 'Rejected' || newStatus === 'Cancelled') {
          db.prepare("UPDATE time_slots SET status = 'AVAILABLE' WHERE id = ?").run(current.slot_id);
        }
      } else {
        // Find slot by doctor, date, and start_time
        if (newStatus === 'Approved') {
          db.prepare(`
            UPDATE time_slots SET status = 'BOOKED'
            WHERE doctor_id = ? AND date = ? AND start_time = ?
          `).run(current.doctor_id, current.date, current.time_slot);
        } else if (newStatus === 'Rejected' || newStatus === 'Cancelled') {
          db.prepare(`
            UPDATE time_slots SET status = 'AVAILABLE'
            WHERE doctor_id = ? AND date = ? AND start_time = ?
          `).run(current.doctor_id, current.date, current.time_slot);
        }
      }
    });

    updateTx();
    return this.findById(id);
  }

  // Reschedule appointment to a new date and time slot
  static reschedule(id, { date, time_slot, slot_id = null }) {
    const current = this.findById(id);
    if (!current) return null;

    if (!['Pending', 'Approved'].includes(current.status)) {
      const err = new Error(`Cannot reschedule appointment with status '${current.status}'. Only Pending or Approved appointments can be rescheduled.`);
      err.statusCode = 400;
      throw err;
    }

    // Check conflict for new date & time_slot
    const conflict = db.prepare(`
      SELECT appointment_id, status FROM appointments
      WHERE doctor_id = ? AND date = ? AND time_slot = ? AND status IN ('Pending', 'Approved') AND appointment_id != ?
    `).get(current.doctor_id, date, time_slot, id);

    if (conflict) {
      const err = new Error(`The slot (${time_slot} on ${date}) is already occupied. Please choose another time.`);
      err.statusCode = 409;
      throw err;
    }

    const tx = db.transaction(() => {
      // 1. Release old slot
      if (current.slot_id) {
        db.prepare("UPDATE time_slots SET status = 'AVAILABLE' WHERE id = ?").run(current.slot_id);
      } else {
        db.prepare("UPDATE time_slots SET status = 'AVAILABLE' WHERE doctor_id = ? AND date = ? AND start_time = ?")
          .run(current.doctor_id, current.date, current.time_slot);
      }

      // 2. Reserve new slot if exists
      let newSlotId = slot_id;
      if (!newSlotId) {
        const slot = db.prepare("SELECT id FROM time_slots WHERE doctor_id = ? AND date = ? AND start_time = ?")
          .get(current.doctor_id, date, time_slot);
        if (slot) newSlotId = slot.id;
      }
      if (newSlotId && current.status === 'Approved') {
        db.prepare("UPDATE time_slots SET status = 'BOOKED' WHERE id = ?").run(newSlotId);
      }

      // 3. Update appointment record
      db.prepare(`
        UPDATE appointments
        SET date = ?,
            time_slot = ?,
            slot_id = ?,
            updated_at = datetime('now')
        WHERE appointment_id = ?
      `).run(date, time_slot, newSlotId || null, id);
    });

    tx();
    return this.findById(id);
  }

  static delete(id) {
    const current = this.findById(id);
    if (!current) return false;

    // Free the slot if active
    if (current.slot_id) {
      db.prepare("UPDATE time_slots SET status = 'AVAILABLE' WHERE id = ?").run(current.slot_id);
    }
    db.prepare('DELETE FROM appointments WHERE appointment_id = ?').run(id);
    return true;
  }
}

module.exports = Appointment;
