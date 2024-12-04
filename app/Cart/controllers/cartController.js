const Cart = require('../models/cartModel');
const Product = require('../../Products/models/productModel');

exports.viewCart = async (req, res) => {
  if (!req.user) {
    return res.render('Cart/cart', {
      title: 'Your Cart',});
  }
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('products.productId');
    res.render('Cart/cart', {
      title: 'Your Cart',
      cart: cart || { products: [] },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching cart');
  }
};

exports.addToCart = async (req, res) => {
  const { productId, size} = req.body;
  //console.log(quantityInput);
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, products: [] });
    }

    const productIndex = cart.products.findIndex(
      (p) => p.productId.toString() === productId && p.size === size
    );

    if (productIndex > -1) {
      cart.products[productIndex].quantity += 1;
    } else {
      cart.products.push({ productId, size, quantity: 1 });
    }

    //console.log(`Cart: ${cart.products}`);

    await cart.save();
    console.log('Cart updated successfully');
    res.redirect('/cart'); // Stay on product page
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding to cart');
  }
};

exports.updateCartItem = async (req, res) => {
  const { productId, size, quantity } = req.body;
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      // Find the product in the cart
      const productIndex = cart.products.findIndex(
        (p) => p.productId.toString() === productId && p.size === size
      );

      if (productIndex !== -1) {
        if (quantity <= 0) {
          // Remove the product if quantity is <= 0
          cart.products.splice(productIndex, 1);
        } else {
          // Update the quantity if > 0
          cart.products[productIndex].quantity = quantity;
        }
        await cart.save();
      }
    }
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating cart');
  }
};


exports.removeFromCart = async (req, res) => {
  const { productId, size } = req.body;
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.products = cart.products.filter(
        (p) => !(p.productId.toString() === productId && p.size === size)
      );
      await cart.save();
    }
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error removing from cart');
  }
};


exports.checkout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('products.productId');
    if (!cart || cart.products.length === 0) {
      return res.redirect('/cart'); // Redirect to cart if it's empty
    }
    res.render('Checkout/checkout', {
      title: 'Checkout',
      cart,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error during checkout');
  }
};

exports.processCheckout = async (req, res) => {
  const orderData = req.body;
  console.log(orderData);

  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('products.productId');
    if (!cart || cart.products.length === 0) {
      return res.redirect('/cart');
    }

    // Create an order (example schema: userId, products, total, paymentMethod, shippingMethod)
    // const order = new Order({
    //   userId: req.user._id,
    //   products: cart.products,
    //   total: cart.products.reduce(
    //     (sum, item) => sum + item.productId.price * item.quantity,
    //     0
    //   ),
    //   paymentMethod,
    //   shippingMethod,
    //   createdAt: new Date(),
    // });
    // await order.save();

    // Clear the cart
    cart.products = [];
    await cart.save();

    orderData.date = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });

    // Redirect to order confirmation or success page
    res.render('Checkout/order-confirmation', {
      title: 'Order confirmation',
      orderData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing checkout');
  }
};
