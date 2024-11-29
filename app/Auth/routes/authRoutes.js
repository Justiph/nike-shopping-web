const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route to render the register page (GET request)
router.get('/register', authController.renderRegisterPage);

// Route to render the login page (GET request)
router.get('/login', authController.renderLoginPage);

// Route for handling the registration form submission (POST request)
router.post('/register', authController.register);

// Route for handling the login form submission (POST request)
router.post('/login', authController.login);

// Route for handling logout (GET request)
router.get('/logout', authController.logout);

module.exports = router;
