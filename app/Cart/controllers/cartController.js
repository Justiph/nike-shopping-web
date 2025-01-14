const Cart = require('../models/cartModel');
const Product = require('../../Products/models/productModel');
const Redis = require("ioredis");

// Initialize ioredis client
const redis = new Redis();
// const redis = new Redis({host : 'redisdb'});

exports.viewCart = async (req, res) => {
  try {
    let cart;

    if (req.user) {
      // Logged-in user: fetch the cart from the database
      cart = await Cart.findOne({ userId: req.user._id }).populate("products.productId");
      cart = cart || { products: [] }; // If no cart exists, return an empty cart
    } else {
      // Guest user: fetch the cart from Redis
      const redisKey = `guestCart:${req.sessionID}`;
      const cartData = await redis.get(redisKey);
      const sessionCart = cartData ? JSON.parse(cartData) : { products: [] };

      // Populate the session cart
      const productIds = sessionCart.products.map((item) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } }).lean();

      const populatedProducts = sessionCart.products.map((item) => {
        const product = products.find((p) => p._id.toString() === item.productId.toString());
        return { ...item, productId: product || null }; // Include null if product not found
      });

      cart = { products: populatedProducts };
    }

    // Render the cart page
    res.render("Cart/cart", {
      title: "Your Cart",
      cart,
    });
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).send("Error fetching cart");
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
      // Guest cart stored in Redis
      const guestCartKey = `guestCart:${req.sessionID}`; // Use sessionID or a unique identifier
      const storedCart = await redis.get(guestCartKey);

      if (storedCart) {
        cart = JSON.parse(storedCart);
      } else {
        cart = { products: [] };
      }
    }

    // Check if the product already exists in the cart
    const productIndex = cart.products.findIndex(
      (p) => p.productId === productId && p.size === size
    );

    if (productIndex > -1) {
      cart.products[productIndex].quantity += 1;
    } else {
      cart.products.push({ productId, size, quantity: 1 });
    }

    // Save the cart
    if (req.user) {
      // Save to database for logged-in users
      await cart.save();
    } else {
      // Save to Redis for guests
      const guestCartKey = `guestCart:${req.sessionID}`;
      await redis.set(guestCartKey, JSON.stringify(cart), "EX", 3600); // Set expiration to 1 day (86400 seconds)
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
  const { productId, size, quantity } = req.body;
  //console.log(req.user)
  console.log("Update Cart Item:", { productId, size, quantity });

  if (!productId || !size || isNaN(quantity)) {
    console.error("Invalid input data:", { productId, size, quantity });
    return res.status(400).json({ success: false, message: "Invalid update input data" });
  }

  try {
    let cart;
    if (req.user) {
      // Logged-in user
      console.log("Log In");
      cart = await Cart.findOne({ userId: req.user._id });
      if (!cart) {
        return res.status(404).json({ success: false, message: "Cart not found" });
      }
    } else {
      // Guest user
      const redisKey = `guestCart:${req.sessionID}`;
      const cartData = await redis.get(redisKey);
      cart = cartData ? JSON.parse(cartData) : { products: [] };
    }

    // Find the product in the cart
    const productIndex = cart.products.findIndex(
      (p) => p.productId.toString() === productId && p.size === size
    );
    //console.log('Cart:', cart);
    //console.log(productIndex);

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

    // Save updated cart
    if (req.user) {
      await cart.save(); // Save the updated cart for logged-in users
    } else {
      const redisKey = `guestCart:${req.sessionID}`;
      await redis.set(redisKey, JSON.stringify(cart), "EX", 60 * 60); // Set expiry to 24 hours
    }

    // Populate the cart for the response
    let populatedCart = { products: [] };
    if (req.user) {
      // Fetch and populate the cart for logged-in users
      populatedCart = await Cart.findOne({ userId: req.user._id }).populate("products.productId");
    } else {
      // Populate guest cart products from Redis
      populatedCart.products = await Promise.all(
        cart.products.map(async (item) => {
          const product = await Product.findById(item.productId);
          return product
            ? { ...item, productId: product } // Populate product details
            : null; // Filter out invalid products
        })
      ).then((products) => products.filter(Boolean)); // Remove null items
    }

    // Return the updated cart
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
      // Logged-in user: Fetch the user's cart from the database
      cart = await Cart.findOne({ userId: req.user._id });
      if (!cart) {
        return res.status(404).json({ success: false, message: "Cart not found" });
      }
    } else {
      // Guest user: Fetch the cart from Redis
      const redisKey = `guestCart:${req.sessionID}`;
      const cartData = await redis.get(redisKey);
      cart = cartData ? JSON.parse(cartData) : { products: [] };

      if (!cart.products || cart.products.length === 0) {
        return res.status(404).json({ success: false, message: "Cart not found" });
      }
    }

    // Filter out the product to remove
    const updatedProducts = cart.products.filter(
      (p) => !(p.productId.toString() === productId && p.size === size)
    );

    if (updatedProducts.length === cart.products.length) {
      return res.status(404).json({ success: false, message: "Product not found in cart" });
    }

    cart.products = updatedProducts;

    // Save the updated cart
    if (req.user) {
      // For logged-in users, save to the database
      await cart.save();
    } else {
      // For guest users, save to Redis
      const redisKey = `guestCart:${req.sessionID}`;
      await redis.set(redisKey, JSON.stringify(cart), "EX", 60 * 60 * 24); // Set expiry to 24 hours
    }

    // Populate the cart for the response
    let populatedCart = { products: [] };

    if (req.user) {
      // Fetch and populate the cart for logged-in users
      populatedCart = await Cart.findOne({ userId: req.user._id }).populate("products.productId");
    } else {
      // Populate guest cart products from Redis
      populatedCart.products = await Promise.all(
        cart.products.map(async (item) => {
          const product = await Product.findById(item.productId);
          return product
            ? { ...item, productId: product } // Populate product details
            : null; // Filter out invalid products
        })
      ).then((products) => products.filter(Boolean)); // Remove null items
    }

    // Return the updated cart
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

