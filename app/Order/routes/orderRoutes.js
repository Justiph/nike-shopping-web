const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController')
const ensureAuth = require('../../../middleware/ensureAuth');

router.post('/checkout', ensureAuth, orderController.processCheckout); 
router.get('/confirmation', ensureAuth, (req, res) => {
    res.render('Checkout/order-confirmation', { title: 'Order Confirmation' });
  }
);

router.get('/orders', ensureAuth, orderController.getOrders);

router.get('/order-detail/:id', ensureAuth, orderController.getOrderDetail);

router.post('/cancel/:orderId', ensureAuth, orderController.cancelOrder);

module.exports = router;