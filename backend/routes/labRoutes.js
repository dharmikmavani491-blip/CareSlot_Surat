const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/reports', optionalAuth, labController.getReports);
router.get('/reports/:id', optionalAuth, labController.getReportById);

module.exports = router;
