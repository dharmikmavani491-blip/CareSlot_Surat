const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// GET /api/patients/me (Current user's profile)
router.get('/me', authMiddleware, patientController.getMyProfile);

// GET /api/patients
router.get('/', optionalAuth, patientController.getAll);

// GET /api/patients/:id
router.get('/:id', optionalAuth, patientController.getById);

// POST /api/patients (CREATE profile)
router.post('/', optionalAuth, patientController.create);

// PUT /api/patients/:id (UPDATE profile)
router.put('/:id', optionalAuth, patientController.update);

// DELETE /api/patients/:id (DELETE demo account/profile)
router.delete('/:id', optionalAuth, patientController.delete);

module.exports = router;
