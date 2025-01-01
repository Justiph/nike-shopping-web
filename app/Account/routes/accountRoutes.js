const express = require('express');
const router = express.Router();
const ensureAuth = require('../../../middleware/ensureAuth');
const upload = require('../../../middleware/CloudinaryStorage');
const accountController = require('../controllers/accountController');

router.get('/profile', ensureAuth, accountController.getProfile);

router.post('/upload-avatar', upload.single('avatar'), accountController.uploadAvatar);

// Delete avatar route
router.post('/delete-avatar', ensureAuth, accountController.deleteAvatar);

router.post('/update-password', ensureAuth, accountController.updatePassword);

module.exports = router;