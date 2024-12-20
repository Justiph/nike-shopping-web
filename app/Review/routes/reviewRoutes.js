const express = require('express');
const router = express.Router();
const ensureAuth = require('../../../middleware/ensureAuth');
const reviewController = require('../controllers/reviewController');

router.post('/add', ensureAuth, reviewController.addReview);
router.get('/fetch', reviewController.getReviews);

module.exports = router;
