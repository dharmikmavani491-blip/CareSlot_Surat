const TimeSlot = require('../models/TimeSlot');

exports.getAll = async (req, res, next) => {
  try {
    const { doctor_id, date, status } = req.query;
    const slots = TimeSlot.findAll({
      doctor_id: doctor_id ? parseInt(doctor_id) : null,
      date,
      status
    });
    res.json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const slot = TimeSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: `Time slot with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      data: slot
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { doctor_id, date, start_time, end_time, status = 'AVAILABLE' } = req.body;
    if (!doctor_id || !date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'Please provide doctor_id, date, start_time, and end_time.'
      });
    }

    const slot = TimeSlot.create({ doctor_id, date, start_time, end_time, status });
    res.status(201).json({
      success: true,
      message: 'Time slot created successfully!',
      data: slot
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updated = TimeSlot.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Time slot with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      message: 'Time slot updated successfully!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const deleted = TimeSlot.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Time slot with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      message: 'Time slot removed successfully!'
    });
  } catch (err) {
    next(err);
  }
};

exports.getAvailable = async (req, res, next) => {
  try {
    const { doctor_id, date } = req.query;
    if (!doctor_id || !date) {
      return res.status(400).json({
        success: false,
        error: 'Please provide doctor_id and date query parameters.'
      });
    }

    const slots = TimeSlot.getScheduleForDoctorDate(parseInt(doctor_id), date);
    res.json({
      success: true,
      doctor_id: parseInt(doctor_id),
      date,
      count: slots.length,
      data: slots
    });
  } catch (err) {
    next(err);
  }
};
