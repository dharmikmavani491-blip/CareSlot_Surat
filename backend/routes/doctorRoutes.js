const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// GET /api/doctors
router.get('/', doctorController.getAll);

// GET /api/doctors/:id/schedule (Section 4: Today's schedule with available & booked slots + patient info)
router.get('/:id/schedule', doctorController.getSchedule);

// GET /api/doctors/:id
router.get('/:id', doctorController.getById);

// POST /api/doctors (Hospital / Admin)
router.post('/', authMiddleware, authorize('hospital', 'admin'), doctorController.create);

// PUT /api/doctors/:id
router.put('/:id', authMiddleware, authorize('hospital', 'admin'), doctorController.update);

// DELETE /api/doctors/:id
router.delete('/:id', authMiddleware, authorize('hospital', 'admin'), doctorController.delete);

module.exports = router;
