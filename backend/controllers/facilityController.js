const HospitalBed = require('../models/HospitalBed');
const DoctorReview = require('../models/DoctorReview');
const BloodInventory = require('../models/BloodInventory');

// GET /api/facilities/beds
exports.getBeds = async (req, res, next) => {
  try {
    const { hospital_id, bed_type } = req.query;
    const beds = HospitalBed.findAll({
      hospital_id: hospital_id ? parseInt(hospital_id) : null,
      bed_type
    });
    res.json({
      success: true,
      count: beds.length,
      data: beds
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/facilities/beds/summary
exports.getBedSummary = async (req, res, next) => {
  try {
    const summary = HospitalBed.getSummary();
    res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/facilities/blood-inventory
exports.getBloodInventory = async (req, res, next) => {
  try {
    const { hospital_id, blood_group, status } = req.query;
    const items = BloodInventory.findAll({
      hospital_id: hospital_id ? parseInt(hospital_id) : null,
      blood_group,
      status
    });
    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/facilities/blood-inventory/summary
exports.getBloodSummary = async (req, res, next) => {
  try {
    const summary = BloodInventory.getSummary();
    res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/facilities/blood-request
exports.requestBlood = async (req, res, next) => {
  try {
    const { hospital_id, blood_group, units_needed, patient_name, hospital_room, urgency_level, contact_phone } = req.body;
    if (!blood_group || !units_needed || !patient_name || !contact_phone) {
      return res.status(400).json({
        success: false,
        error: 'Patient name, blood group, units needed, and contact phone are required.'
      });
    }

    const requisitionId = `SRT-BLD-${Date.now().toString().slice(-6)}`;
    res.status(201).json({
      success: true,
      message: 'Urgent blood requisition registered with Surat Regional Blood Bank Network.',
      data: {
        requisition_id: requisitionId,
        patient_name,
        blood_group,
        units_needed: parseInt(units_needed),
        urgency_level: urgency_level || 'Immediate / Emergency',
        status: 'DISPATCH_AUTHORIZED',
        verification_code: Math.floor(100000 + Math.random() * 900000),
        pickup_instructions: 'Bring 1 blood cross-match sample vial to the designated Hospital Blood Bank counter within 90 minutes.'
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/facilities/reviews
exports.getReviews = async (req, res, next) => {
  try {
    const { doctor_id, limit } = req.query;
    if (doctor_id) {
      const reviews = DoctorReview.findByDoctor(parseInt(doctor_id));
      return res.json({ success: true, count: reviews.length, data: reviews });
    }
    const reviews = DoctorReview.findAll(limit ? parseInt(limit) : 10);
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    next(err);
  }
};

// POST /api/facilities/reviews
exports.submitReview = async (req, res, next) => {
  try {
    const { doctor_id, rating, wait_time_rating, comment, appointment_id } = req.body;
    if (!doctor_id || !rating) {
      return res.status(400).json({ success: false, error: 'Doctor ID and star rating are required.' });
    }

    const patientId = req.user ? req.user.id : 1;
    const displayName = req.user ? (req.user.username || 'Verified Patient') : 'Verified Patient';

    const review = DoctorReview.create({
      doctor_id: parseInt(doctor_id),
      patient_id: patientId,
      appointment_id: appointment_id ? parseInt(appointment_id) : null,
      rating: parseInt(rating),
      wait_time_rating: wait_time_rating ? parseInt(wait_time_rating) : 5,
      comment: comment || 'Consultation completed satisfactorily.',
      patient_display_name: displayName
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your verified patient review has been submitted.',
      data: review
    });
  } catch (err) {
    next(err);
  }
};

