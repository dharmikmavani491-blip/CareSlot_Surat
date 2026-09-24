const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// GET /api/slots/available (Patient booking workflow)
router.get('/available', slotController.getAvailable);

// GET /api/slots
router.get('/', slotController.getAll);

// GET /api/slots/:id
router.get('/:id', slotController.getById);

// POST /api/slots (Hospital / Admin)
router.post('/', authMiddleware, authorize('hospital', 'admin'), slotController.create);

// PUT /api/slots/:id
router.put('/:id', authMiddleware, authorize('hospital', 'admin'), slotController.update);

// DELETE /api/slots/:id
router.delete('/:id', authMiddleware, authorize('hospital', 'admin'), slotController.delete);

module.exports = router;
