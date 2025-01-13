const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController')
const ensureAuth = require('../../../middleware/ensureAuth');
const checkUserStatus = require('../../../middleware/checkUserStatus');

router.post('/checkout', ensureAuth, checkUserStatus, orderController.processCheckout); 
router.get('/confirmation', ensureAuth, checkUserStatus, (req, res) => {
    res.render('Checkout/order-confirmation', { title: 'Order Confirmation' });
  }
);

router.get('/orders', ensureAuth, checkUserStatus, orderController.getOrders);

router.get('/order-detail/:id', ensureAuth, checkUserStatus, orderController.getOrderDetail);

router.post('/cancel/:orderId', ensureAuth, checkUserStatus, orderController.cancelOrder);

module.exports = router;