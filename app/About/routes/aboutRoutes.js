const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController'); // Import the cart controller

// Protected route for the cart page
router.get('/about', aboutController.renderAbout);

module.exports = router;