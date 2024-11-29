// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../../middleware/authenticate'); // Import the authentication middleware
const cartController = require('../controllers/cartController'); // Import the cart controller

// Protected route for the cart page
router.get('/cart', cartController.renderCart);

module.exports = router;