const LabReport = require('../models/LabReport');
const Patient = require('../models/Patient');

// GET /api/labs/reports
exports.getReports = async (req, res, next) => {
  try {
    let patient_id = req.query.patient_id;

    if (req.user && req.user.role === 'patient') {
      const patient = Patient.findByUserId(req.user.id);
      if (patient) patient_id = patient.id;
    }

    // Default to patient 1 if demo
    if (!patient_id) patient_id = 1;

    const reports = LabReport.findAll({
      patient_id: parseInt(patient_id),
      hospital_id: req.query.hospital_id ? parseInt(req.query.hospital_id) : null
    });

    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/labs/reports/:id
exports.getReportById = async (req, res, next) => {
  try {
    const report = LabReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Diagnostic report not found.' });
    }
    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};
