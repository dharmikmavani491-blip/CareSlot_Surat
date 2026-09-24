const Department = require('../models/Department');

exports.getAll = async (req, res, next) => {
  try {
    const hospitalId = req.query.hospital_id || req.query.hospitalId || null;
    const departments = Department.findAll(hospitalId);
    res.json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const dept = Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({
        success: false,
        error: `Department with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      data: dept
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { hospital_id, name, description, icon } = req.body;
    if (!hospital_id || !name) {
      return res.status(400).json({
        success: false,
        error: 'Please provide hospital_id and department name.'
      });
    }

    const dept = Department.create({ hospital_id, name, description, icon });
    res.status(201).json({
      success: true,
      message: 'Department created successfully!',
      data: dept
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updated = Department.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Department with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      message: 'Department updated successfully!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const deleted = Department.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Department with ID ${req.params.id} not found.`
      });
    }
    res.json({
      success: true,
      message: 'Department deleted successfully!'
    });
  } catch (err) {
    next(err);
  }
};
