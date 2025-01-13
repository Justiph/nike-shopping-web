const express = require('express');
const router = express.Router();
const ensureAuth = require('../../../middleware/ensureAuth');
const reviewController = require('../controllers/reviewController');
const checkUserStatus = require('../../../middleware/checkUserStatus');

router.post('/add', ensureAuth, checkUserStatus, reviewController.addReview);
router.get('/fetch', reviewController.getReviews);

module.exports = router;
