const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController.js');

// Route to handle GET request for homepage
router.get('/', homeController.renderHomepage);

module.exports = router;
