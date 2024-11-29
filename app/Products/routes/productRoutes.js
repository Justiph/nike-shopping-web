const express = require('express');
const router = express.Router();
const { getShoppingPage, getProductDetails } = require('../controllers/productController');

// Register the route for shopping page
router.get('/shopping', getShoppingPage);

// Register the route for product details
router.get('/product-details/:id', getProductDetails);

module.exports = router;
