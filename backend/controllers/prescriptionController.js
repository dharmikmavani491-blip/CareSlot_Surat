const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');

// GET /api/prescriptions/appointment/:id
exports.getByAppointmentId = async (req, res, next) => {
  try {
    const appointmentId = parseInt(req.params.id);
    const prescription = Prescription.findByAppointmentId(appointmentId);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found for this consultation.'
      });
    }
    res.json({
      success: true,
      data: prescription
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/prescriptions/patient/me
exports.getMyPrescriptions = async (req, res, next) => {
  try {
    let patientId = 1;
    if (req.user) {
      const patient = Patient.findByUserId(req.user.id);
      if (patient) patientId = patient.id;
    }
    const prescriptions = Prescription.findAllByPatient(patientId);
    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/prescriptions/:id
exports.getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const prescription = Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription record not found.'
      });
    }
    res.json({
      success: true,
      data: prescription
    });
  } catch (err) {
    next(err);
  }
};
