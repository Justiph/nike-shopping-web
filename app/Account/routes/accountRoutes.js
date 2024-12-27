const express = require('express');
const router = express.Router();
const ensureAuth = require('../../../middleware/ensureAuth');
const accountController = require('../controllers/accountController');

router.get('/profile', ensureAuth, accountController.getProfile);

module.exports = router;