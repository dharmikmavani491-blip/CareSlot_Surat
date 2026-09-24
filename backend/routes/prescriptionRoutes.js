const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/appointment/:id', optionalAuth, prescriptionController.getByAppointmentId);
router.get('/patient/me', optionalAuth, prescriptionController.getMyPrescriptions);
router.get('/:id', optionalAuth, prescriptionController.getById);

module.exports = router;
