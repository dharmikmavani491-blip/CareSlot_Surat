const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// GET /api/departments
router.get('/', departmentController.getAll);

// GET /api/departments/:id
router.get('/:id', departmentController.getById);

// POST /api/departments (Hospital/Admin or demo test)
router.post('/', authMiddleware, authorize('hospital', 'admin'), departmentController.create);

// PUT /api/departments/:id
router.put('/:id', authMiddleware, authorize('hospital', 'admin'), departmentController.update);

// DELETE /api/departments/:id
router.delete('/:id', authMiddleware, authorize('hospital', 'admin'), departmentController.delete);

module.exports = router;
