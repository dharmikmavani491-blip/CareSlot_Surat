const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

exports.getAll = async (req, res, next) => {
  try {
    const { status, date, doctor_id, hospital_id, patient_id } = req.query;
    let queryHospitalId = hospital_id ? parseInt(hospital_id) : null;
    let queryPatientId = patient_id ? parseInt(patient_id) : null;

    // Role-based scoping if authenticated
    if (req.user) {
      if (req.user.role === 'patient') {
        const patient = Patient.findByUserId(req.user.id);
        if (patient) {
          queryPatientId = patient.id;
        }
      } else if (req.user.role === 'hospital' && req.user.hospital_id) {
        queryHospitalId = req.user.hospital_id;
      }
    }

    const appointments = Appointment.findAll({
      patient_id: queryPatientId,
      hospital_id: queryHospitalId,
      doctor_id: doctor_id ? parseInt(doctor_id) : null,
      status: status || null,
      date: date || null
    });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const appointment = Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: `Appointment with ID ${req.params.id} not found.`
      });
    }

    // Authorization check
    if (req.user) {
      if (req.user.role === 'patient') {
        const patient = Patient.findByUserId(req.user.id);
        if (patient && appointment.patient_id !== patient.id) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: You can only view your own appointments.'
          });
        }
      } else if (req.user.role === 'hospital' && req.user.hospital_id) {
        if (appointment.hospital_id !== req.user.hospital_id) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: You can only view appointments for your hospital.'
          });
        }
      }
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    let {
      patient_id,
      hospital_id,
      doctor_id,
      department_id,
      date,
      time_slot,
      slot_id,
      reason,
      symptoms,
      notes,
      full_name,
      age,
      gender,
      contact,
      address
    } = req.body;

    // If authenticated as a patient, resolve or create their patient profile
    if (req.user && req.user.role === 'patient') {
      let patient = Patient.findByUserId(req.user.id);
      if (!patient) {
        patient = Patient.create({
          user_id: req.user.id,
          full_name: full_name || req.user.username,
          age: age || 30,
          gender: gender || 'Other',
          contact: contact || '+91-99999-00000',
          address: address || '',
          medical_history: ''
        });
      }
      patient_id = patient.id;
    }

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        error: 'Patient profile required to book an appointment.'
      });
    }

    if (!hospital_id || !doctor_id || !department_id || !date || !time_slot || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all booking fields: hospital, department, doctor, date, time slot, and reason.'
      });
    }

    const appointment = Appointment.create({
      patient_id: parseInt(patient_id),
      hospital_id: parseInt(hospital_id),
      doctor_id: parseInt(doctor_id),
      department_id: parseInt(department_id),
      date,
      time_slot,
      slot_id: slot_id ? parseInt(slot_id) : null,
      reason,
      symptoms,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully! Current status: Pending approval.',
      data: appointment
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const current = Appointment.findById(req.params.id);
    if (!current) {
      return res.status(404).json({
        success: false,
        error: `Appointment with ID ${req.params.id} not found.`
      });
    }

    // Patient can only edit if status is Pending
    if (req.user && req.user.role === 'patient' && current.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot modify appointment once it has been ${current.status}. Please contact the hospital.`
      });
    }

    const updated = Appointment.update(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Appointment details updated successfully!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/appointments/:id/status
// Handles: Approve, Reject, Cancel, Mark Completed
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, rejection_reason, notes } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Please specify the new status.'
      });
    }

    const current = Appointment.findById(req.params.id);
    if (!current) {
      return res.status(404).json({
        success: false,
        error: `Appointment with ID ${req.params.id} not found.`
      });
    }

    // Role verification for status changes:
    // Only hospital/admin can approve, reject, complete
    // Both hospital and patient can cancel
    if (req.user) {
      if (['Approved', 'Rejected', 'Completed'].includes(status) && req.user.role === 'patient') {
        return res.status(403).json({
          success: false,
          error: `Forbidden: Patients cannot set appointment status to '${status}'.`
        });
      }
    }

    const updated = Appointment.updateStatus(req.params.id, status, rejection_reason, notes);

    let message = `Appointment marked as ${status}.`;
    if (status === 'Approved') {
      message = 'Appointment approved! The time slot has been marked as BOOKED.';
    } else if (status === 'Rejected') {
      message = 'Appointment request rejected. The time slot is now AVAILABLE again.';
    } else if (status === 'Cancelled') {
      message = 'Appointment cancelled. The time slot is now AVAILABLE again.';
    } else if (status === 'Completed') {
      message = 'Appointment marked as completed.';
    }

    res.json({
      success: true,
      message,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Patient cancels appointment
exports.cancel = async (req, res, next) => {
  try {
    const current = Appointment.findById(req.params.id);
    if (!current) {
      return res.status(404).json({
        success: false,
        error: `Appointment with ID ${req.params.id} not found.`
      });
    }

    if (current.status === 'Completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel an already completed appointment.'
      });
    }

    const updated = Appointment.updateStatus(req.params.id, 'Cancelled');
    res.json({
      success: true,
      message: 'Appointment cancelled successfully. Time slot has been freed.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.reschedule = async (req, res, next) => {
  try {
    const { date, time_slot, slot_id } = req.body;
    if (!date || !time_slot) {
      return res.status(400).json({
        success: false,
        error: 'Please provide new date and time_slot for rescheduling.'
      });
    }

    const current = Appointment.findById(req.params.id);
    if (!current) {
      return res.status(404).json({
        success: false,
        error: `Appointment with ID ${req.params.id} not found.`
      });
    }

    const updated = Appointment.reschedule(req.params.id, { date, time_slot, slot_id });
    res.json({
      success: true,
      message: `Appointment #${updated.appointment_number} rescheduled successfully to ${date} at ${time_slot}!`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const deleted = Appointment.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Appointment with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      message: 'Appointment deleted successfully!'
    });
  } catch (err) {
    next(err);
  }
};
