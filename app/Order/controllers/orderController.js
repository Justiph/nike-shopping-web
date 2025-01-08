const Order = require('../models/orderModel');
const Cart = require('../../Cart/models/cartModel');

exports.processCheckout = async (req, res) => {
    const { name, email, phone, paymentMethod, deliveryMethod, province, district, commune, street } = req.body;
  
    try {
      const cart = await Cart.findOne({ userId: req.user._id }).populate('products.productId');
      if (!cart || cart.products.length === 0) {
        return res.redirect('/cart');
      }
  
      // Calculate total price
      const total = cart.products.reduce(
        (sum, item) => sum + item.productId.price * item.quantity,
        0
      );
  
      // Create an order
      const order = new Order({
        userId: req.user._id,
        products: cart.products.map((item) => ({
          productId: item.productId._id,
          size: item.size || null,
          quantity: item.quantity,
          price: item.productId.price,
        })),
        total,
        paymentMethod,
        deliveryMethod,
        name,
        email,
        phone,
        address: {
          province: province,
          district: district,
          commune: commune,
          street: street,
        },
        date: new Date(),
      });
  
      await order.save();
  
      // Clear the cart
      cart.products = [];
      await cart.save();
  
      // Redirect to order confirmation or success page
      res.render('Checkout/order-confirmation', {
        title: 'Order confirmation',
        orderData: {
          name,
          email,
          phone,
          paymentMethod,
          deliveryMethod,
          province,
          district,
          commune,
          street,
          total,
          orderId: order._id,
          date: order.date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error processing checkout');
    }
  };