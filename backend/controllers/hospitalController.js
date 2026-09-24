const Hospital = require('../models/Hospital');

exports.getAll = async (req, res, next) => {
  try {
    const hospitals = Hospital.findAll();
    res.json({
      success: true,
      count: hospitals.length,
      data: hospitals
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const hospital = Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: `Hospital with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      data: hospital
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updated = Hospital.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Hospital with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      message: 'Hospital details updated successfully!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const stats = Hospital.getStats(req.params.id);
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};
