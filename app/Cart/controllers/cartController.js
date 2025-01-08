const Cart = require('../models/cartModel');
const Product = require('../../Products/models/productModel');

exports.viewCart = async (req, res) => {
  try {
    let cart;

    if (req.user) {
      // Logged-in user: fetch the cart from the database
      cart = await Cart.findOne({ userId: req.user._id }).populate('products.productId');
      cart = cart || { products: [] }; // If no cart exists, return an empty cart
    } else {
      // Guest user: use the cart from the session
      const sessionCart = req.session.cart || { products: [] };

      // Populate the session cart
      const productIds = sessionCart.products.map((item) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } }).lean();

      const populatedProducts = sessionCart.products.map((item) => {
        const product = products.find((p) => p._id.toString() === item.productId.toString());
        return { ...item, productId: product || null }; // Include null if product not found
      });

      cart = { products: populatedProducts };
    }

    res.render('Cart/cart', {
      title: 'Your Cart',
      cart,
    });
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).send('Error fetching cart');
  }
};


exports.addToCart = async (req, res) => {

  try {
    const { productId, size } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }
    if (!size) {
      return res.status(400).json({ error: "Size is required" });
    }

    let cart;

    if (req.user) {
      // User is logged in
      cart = await Cart.findOne({ userId: req.user._id });
      if (!cart) {
        cart = new Cart({ userId: req.user._id, products: [] });
      }
    } else {
      // Guest cart stored in session
      if (!req.session.cart) {
        req.session.cart = { products: [] };
      }
      cart = req.session.cart;
    }

    const productIndex = cart.products.findIndex(
      (p) => p.productId === productId && p.size === size
    );

    if (productIndex > -1) {
      cart.products[productIndex].quantity += 1;
    } else {
      cart.products.push({ productId, size, quantity: 1 });
    }

    // Save to DB for logged-in users, or update session for guests
    if (req.user) {
      await cart.save();
    } else {
      req.session.cart = cart;
    }

    res.json({ message: "Product added to cart successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding to cart." });
  }
};


// Merge guest cart with user cart after login
exports.mergeCart = async (req, res, sessionCart) => {
  if (!sessionCart || sessionCart.products.length === 0) {
    console.log("No session cart to merge");
    return; // No session cart, no need to do anything
  }

  try {
    // Fetch the user's existing cart
    let userCart = await Cart.findOne({ userId: req.user._id });

    // If no user cart exists, create a new one
    if (!userCart) {
      userCart = new Cart({ userId: req.user._id, products: [] });
    }

    // Get the guest cart (session cart)
    const guestCart = sessionCart.products;
    //console.log("Guest cart:", guestCart);

    // Loop through the guest cart products and merge them into the user's cart
    guestCart.forEach((guestProduct) => {
      const existingProduct = userCart.products.find(
        (p) =>
          p.productId.toString() === guestProduct.productId &&
          p.size === guestProduct.size
      );

      if (existingProduct) {
        // If product exists, update the quantity
        existingProduct.quantity += guestProduct.quantity;
      } else {
        // If product does not exist, add it to the cart
        userCart.products.push(guestProduct);
      }
    });

    // Save the updated user cart
    await userCart.save();

    // Clear the session cart after merging
    //req.session.cart = null;
  } catch (err) {
    console.error(err);
    res.status(500).send("Error merging carts.");
  }
};


exports.updateCartItem = async (req, res) => {
  //console.log("Request body:", req.body);
  const { productId, size, quantity } = req.body;

  if (!productId || !size || isNaN(quantity)) {
    console.error("Invalid input data:", { productId, size, quantity });
    return res.status(400).json({ success: false, message: "Invalid update input data" });
  }

  try {
    let cart;
    if (req.user) {
      // Logged-in user
      cart = await Cart.findOne({ userId: req.user._id });
    } else {
      // Guest user
      cart = req.session.cart || { products: [] };
    }

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    // Find the product in the cart
    const productIndex = cart.products.findIndex(
      (p) => p.productId.toString() === productId && p.size === size
    );

    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: "Product not found in cart" });
    }

    // Calculate the new quantity
    const newQuantity = cart.products[productIndex].quantity + parseInt(quantity, 10);

    if (newQuantity <= 0) {
      // Remove the product if quantity becomes zero or negative
      cart.products.splice(productIndex, 1);
    } else {
      // Update the product quantity
      cart.products[productIndex].quantity = newQuantity;
    }

    // Create a populated cart for the response (do not modify session cart)
    let populatedCart = { products: [] };

    if (req.user) {
      // Save the updated cart for logged-in users
      await cart.save();
      populatedCart = await Cart.findOne({ userId: req.user._id }).populate('products.productId');
    } else {
      // Populate guest cart products without modifying session
      populatedCart.products = await Promise.all(
        cart.products.map(async (item) => {
          const product = await Product.findById(item.productId);
          return product
            ? { ...item, productId: product } // Populate product details
            : null; // Filter out invalid products
        })
      ).then((products) => products.filter(Boolean)); // Remove null items
    }

    // Return the populated cart response
    res.json({ success: true, cart: populatedCart });
  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



exports.removeFromCart = async (req, res) => {
  const { productId, size } = req.body;

  if (!productId || !size) {
    return res.status(400).json({ success: false, message: "Invalid remove input data" });
  }

  try {
    let cart;
    if (req.user) {
      // Logged-in user
      cart = await Cart.findOne({ userId: req.user._id });
    } else {
      // Guest user
      cart = req.session.cart || { products: [] };
    }

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    // Filter out the product to remove
    const updatedProducts = cart.products.filter(
      (p) => !(p.productId.toString() === productId && p.size === size)
    );

    if (updatedProducts.length === cart.products.length) {
      return res.status(404).json({ success: false, message: "Product not found in cart" });
    }

    cart.products = updatedProducts;

    // Create a populated cart for the response (do not modify session cart)
    let populatedCart = { products: [] };

    if (req.user) {
      // Save the updated cart for logged-in users
      await cart.save();
      populatedCart = await Cart.findOne({ userId: req.user._id }).populate('products.productId');
    } else {
      // Populate guest cart products without modifying session
      populatedCart.products = await Promise.all(
        cart.products.map(async (item) => {
          const product = await Product.findById(item.productId);
          return product
            ? { ...item, productId: product } // Populate product details
            : null; // Filter out invalid products
        })
      ).then((products) => products.filter(Boolean)); // Remove null items
    }

    // Return the populated cart response
    res.json({ success: true, cart: populatedCart });
  } catch (err) {
    console.error("Error removing from cart:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
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
    // const order = new Order
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
