const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// GET /api/appointments (Scoped by role if logged in, or filtered by query params)
router.get('/', optionalAuth, appointmentController.getAll);

// GET /api/appointments/:id
router.get('/:id', optionalAuth, appointmentController.getById);

// POST /api/appointments (Create appointment)
router.post('/', optionalAuth, appointmentController.create);

// PUT /api/appointments/:id (Update appointment details)
router.put('/:id', optionalAuth, appointmentController.update);

// PATCH /api/appointments/:id/status (Approve, Reject, Cancel, Complete)
router.patch('/:id/status', optionalAuth, appointmentController.updateStatus);

// POST /api/appointments/:id/cancel (Cancel shortcut)
router.post('/:id/cancel', optionalAuth, appointmentController.cancel);

// POST /api/appointments/:id/reschedule (Reschedule to new date/time)
router.post('/:id/reschedule', optionalAuth, appointmentController.reschedule);

// DELETE /api/appointments/:id
router.delete('/:id', optionalAuth, appointmentController.delete);

module.exports = router;
