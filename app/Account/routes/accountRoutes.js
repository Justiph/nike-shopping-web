const express = require('express');
const router = express.Router();
const ensureAuth = require('../../../middleware/ensureAuth');
const upload = require('../../../middleware/CloudinaryStorage');
const checkUserStatus = require('../../../middleware/checkUserStatus');
const accountController = require('../controllers/accountController');

router.get('/profile', ensureAuth, checkUserStatus, accountController.getProfile);

router.post('/upload-avatar', ensureAuth, checkUserStatus, upload.single('avatar'), accountController.uploadAvatar);

// Delete avatar route
router.post('/delete-avatar', ensureAuth, checkUserStatus, accountController.deleteAvatar);

router.post('/update-password', ensureAuth, checkUserStatus, accountController.updatePassword);

router.get('/account-banned', (req, res) => {
    res.render('Account/account-banned', { layout: false });
  });  

module.exports = router;