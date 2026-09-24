const Doctor = require('../models/Doctor');
const TimeSlot = require('../models/TimeSlot');

exports.getAll = async (req, res, next) => {
  try {
    const { hospital_id, department_id, search } = req.query;
    const doctors = Doctor.findAll({
      hospital_id: hospital_id ? parseInt(hospital_id) : null,
      department_id: department_id ? parseInt(department_id) : null,
      search: search ? search.trim() : null
    });
    res.json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const doc = Doctor.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: `Doctor with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      data: doc
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { hospital_id, department_id, name, qualification, specialization } = req.body;
    if (!hospital_id || !department_id || !name || !qualification || !specialization) {
      return res.status(400).json({
        success: false,
        error: 'Please provide hospital_id, department_id, doctor name, qualification, and specialization.'
      });
    }

    const doctor = Doctor.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Doctor added successfully!',
      data: doctor
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updated = Doctor.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Doctor with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      message: 'Doctor details updated successfully!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const deleted = Doctor.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Doctor with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      message: 'Doctor removed successfully!'
    });
  } catch (err) {
    next(err);
  }
};

// Section 4 Requirement: Doctor Schedule for specific date
// Displays: Doctor name, Speciality, Department, Date, Today's schedule, Available slots, Booked slots
// Clicking a booked slot shows demo patient details!
exports.getSchedule = async (req, res, next) => {
  try {
    const doctorId = parseInt(req.params.id);
    const doctor = Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: `Doctor with ID ${doctorId} not found.`
      });
    }

    const date = req.query.date || new Date().toISOString().split('T')[0];
    const slots = TimeSlot.getScheduleForDoctorDate(doctorId, date);

    const availableSlots = slots.filter(s => s.status === 'AVAILABLE');
    const bookedSlots = slots.filter(s => s.status === 'BOOKED');

    res.json({
      success: true,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        department: doctor.department_name,
        hospital: doctor.hospital_name,
        room_number: doctor.room_number,
        opd_timing: doctor.opd_timing,
        consultation_fee: doctor.consultation_fee
      },
      date,
      summary: {
        total_slots: slots.length,
        available_count: availableSlots.length,
        booked_count: bookedSlots.length
      },
      schedule_label: 'Demo Schedule — for academic project',
      slots,
      available_slots: availableSlots,
      booked_slots: bookedSlots
    });
  } catch (err) {
    next(err);
  }
};
