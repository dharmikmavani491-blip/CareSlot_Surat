const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');
const { optionalAuth, authenticateToken } = require('../middleware/authMiddleware');

router.get('/beds', facilityController.getBeds);
router.get('/beds/summary', facilityController.getBedSummary);
router.get('/blood-inventory', facilityController.getBloodInventory);
router.get('/blood-inventory/summary', facilityController.getBloodSummary);
router.post('/blood-request', optionalAuth, facilityController.requestBlood);
router.get('/reviews', facilityController.getReviews);
router.post('/reviews', optionalAuth, facilityController.submitReview);

module.exports = router;
