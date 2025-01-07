const express = require('express');
const passport = require('passport');
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

router.get('/activate/:token', authController.activateAccount);

// Google Sign-In
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Callback
router.get('/google/callback', authController.googleCallback); // Google callback
// router.get(
//     '/google/callback',
//     passport.authenticate('google', { failureRedirect: '/auth/login' }),
//     async (req, res) => {
//         try {
//             // Preserve session cart before login
//             const sessionCart = req.session.cart;
        
//             // If there's a session cart, merge it with the user's cart
//             if (sessionCart && sessionCart.products.length > 0) {
//                 await mergeCart(req, res, sessionCart);
//             }
        
//             // Clear the session cart after merging
//             req.session.cart = null;
        
//             // Redirect to homepage or dashboard after successful login
//             res.redirect('/');
//         } catch (err) {
//             console.error('Callback error:', err);
//             res.status(500).send('Internal Server Error');
//         }
//     }
// );


// Link Google Account to Existing User
router.get(
    '/google/link',
    passport.authenticate('google', { scope: ['profile', 'email'], state: 'link' })
);

router.get('/google/callback/link', async (req, res) => {
    try {
      const user = req.user; // Current logged-in user
      const googleID = req.session.googleID; // Store Google ID in session during linking
  
      user.googleID = googleID;
      await user.save();
  
      res.redirect('/profile'); // Redirect to profile page
    } catch (err) {
      res.status(500).send('Error linking Google account');
    }
});


module.exports = router;
