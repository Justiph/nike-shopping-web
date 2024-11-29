const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Render the contact form (GET request)
router.get('/contact', contactController.renderContactForm);

// Handle form submission (POST request)
router.post('/contact', contactController.handleFormSubmission);

module.exports = router;
