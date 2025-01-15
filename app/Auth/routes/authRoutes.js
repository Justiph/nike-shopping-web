const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');
const Redis = require('ioredis');
//const redis = new Redis();
//const redis = new Redis({host : 'redisdb'});

// const redis = new Redis({
//   host: 'redisdb', // Hostname của dịch vụ Redis
//   port: 6379,      // Cổng Redis (mặc định là 6379)
// });

const redis = new Redis({
  host: 'redis.lptdevops.website',  // Đảm bảo tên miền đúng
  db: 0,                            // Mặc định DB 0
});

redis.ping()
  .then((result) => {
    console.log('Redis is connected:', result);  // Kết quả sẽ là "PONG" nếu kết nối thành công
  })
  .catch((error) => {
    console.error('Error connecting to Redis:', error);  // In ra lỗi nếu không kết nối được
  });

const crypto = require('crypto');

// Route to render the register page (GET request)
router.get('/register', authController.renderRegisterPage);

// Route to render the login page (GET request)
router.get('/login', authController.renderLoginPage);

// Route for handling the registration form submission (POST request)
router.post('/register', authController.register);

router.get('/waiting-activation', authController.waitingActivation);

// Route for handling the login form submission (POST request)
router.post('/login', authController.login);

// Route for handling logout (GET request)
router.get('/logout', authController.logout);

router.get('/activate/:token', authController.activateAccount);

// Google Sign-In
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Callback
//router.get('/google/callback', authController.googleCallback); // Google callback
router.get(
  '/google/callback',
  async (req, res, next) => {
    try {
      // Fetch guest cart from Redis using session ID before passport authentication
      const redisKey = `guestCart:${req.sessionID}`;
      const cartData = await redis.get(redisKey);
      const sessionCart = cartData ? JSON.parse(cartData) : { products: [] };
      console.log("Redis sessionCart:", sessionCart);

      // Continue with Google authentication
      passport.authenticate('google', { failureRedirect: '/auth/login' })(req, res, next);
    } catch (err) {
      console.error('Error before passport authenticate:', err);
      res.status(500).send('Internal Server Error');
    }
  },
  async (req, res) => {
    try {
      // Merge Redis cart with logged-in user's cart
      const redisKey = `guestCart:${req.sessionID}`;
      const cartData = await redis.get(redisKey);
      const sessionCart = cartData ? JSON.parse(cartData) : { products: [] };

      if (sessionCart.products.length > 0) {
        await mergeCart(req, res, sessionCart);
      }

      // Remove guest cart from Redis after successful merge
      await redis.del(redisKey);

      res.redirect('/'); // Redirect after successful login and cart merge
    } catch (err) {
      console.error('Callback error:', err);
      res.status(500).send('Internal Server Error');
    }
  }
);



// Link Google Account to Existing User
// router.get(
//     '/google/link',
//     passport.authenticate('google', { scope: ['profile', 'email'], state: 'link' })
// );

// router.get('/google/callback/link', async (req, res) => {
//     try {
//       const user = req.user; // Current logged-in user
//       const googleID = req.session.googleID; // Store Google ID in session during linking
  
//       user.googleID = googleID;
//       await user.save();
  
//       res.redirect('/profile'); // Redirect to profile page
//     } catch (err) {
//       res.status(500).send('Error linking Google account');
//     }
// });

router.get('/forgot-password', authController.renderForgotPasswordPage);

// Forgot password route
router.post('/forgot-password', authController.forgotPassword);

router.get("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  //console.log(token);
  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const userData = await redis.get(`resetToken:${hashedToken}`);

    if (!userData) {
      return res.render("auth/reset-password", {
        error: "Liên kết không hợp lệ hoặc đã hết hạn!",
      });
    }

    res.render("auth/reset-password", { token, error: null, title: "Reset Password" });
  } catch (err) {
    console.error(err);
    res.render("auth/reset-password", {
      error: "Đã xảy ra lỗi. Vui lòng thử lại!",
    });
  }
});

// Reset password route
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
