const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// GET /api/hospitals
router.get('/', hospitalController.getAll);

// GET /api/hospitals/:id
router.get('/:id', hospitalController.getById);

// GET /api/hospitals/:id/stats
router.get('/:id/stats', hospitalController.getStats);

// PUT /api/hospitals/:id (Hospital admin / Super admin only)
router.put('/:id', authMiddleware, authorize('hospital', 'admin'), hospitalController.update);

module.exports = router;
