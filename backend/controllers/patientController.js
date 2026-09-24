const Patient = require('../models/Patient');
const User = require('../models/User');

exports.getAll = async (req, res, next) => {
  try {
    const patients = Patient.findAll();
    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const patient = Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: `Patient with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      data: patient
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    const patient = Patient.findByUserId(req.user.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found. Please create one.'
      });
    }
    res.json({
      success: true,
      data: patient
    });
  } catch (err) {
    next(err);
  }
};

// CREATE patient profile
exports.create = async (req, res, next) => {
  try {
    const { user_id, full_name, age, gender, contact, address, medical_history } = req.body;
    const targetUserId = req.user ? req.user.id : user_id;

    if (!targetUserId || !full_name || !contact) {
      return res.status(400).json({
        success: false,
        error: 'Please provide user_id, full_name, and contact phone number.'
      });
    }

    // Check if profile already exists for user
    const existing = Patient.findByUserId(targetUserId);
    if (existing) {
      // Update instead of duplicate error
      const updated = Patient.update(existing.id, req.body);
      return res.json({
        success: true,
        message: 'Patient profile updated successfully!',
        data: updated
      });
    }

    const patient = Patient.create({
      user_id: targetUserId,
      full_name,
      age,
      gender,
      contact,
      address,
      medical_history
    });

    res.status(201).json({
      success: true,
      message: 'Patient profile created successfully!',
      data: patient
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE patient profile
exports.update = async (req, res, next) => {
  try {
    const updated = Patient.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Patient with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      message: 'Patient profile updated successfully!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// DELETE demo patient profile / account
exports.delete = async (req, res, next) => {
  try {
    const patient = Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: `Patient with ID ${req.params.id} not found.`
      });
    }

    Patient.delete(req.params.id);

    // If matching user exists, also delete demo user account cleanly
    if (patient.user_id) {
      User.delete(patient.user_id);
    }

    res.json({
      success: true,
      message: 'Demo patient profile and user account deleted successfully!'
    });
  } catch (err) {
    next(err);
  }
};
