// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const ensureAuth = require('../../../middleware/ensureAuth'); // Import the authentication middleware
const checkUserStatus = require('../../../middleware/checkUserStatus');
const cartController = require('../controllers/cartController'); // Import the cart controller

// Protected route for the cart page
router.get('/', cartController.viewCart);
router.post('/add', cartController.addToCart);
router.post('/update', cartController.updateCartItem);
router.post('/remove', cartController.removeFromCart);
router.get('/checkout', ensureAuth, cartController.checkout);
//router.post('/checkout', ensureAuth, cartController.processCheckout); 

router.get('/order/confirmation', ensureAuth, checkUserStatus, (req, res) => {
    res.render('Checkout/order-confirmation', { title: 'Order Confirmation' });
  }
);
  

module.exports = router;