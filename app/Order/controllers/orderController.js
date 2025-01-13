const Order = require('../models/orderModel');
const Cart = require('../../Cart/models/cartModel');

exports.processCheckout = async (req, res) => {
  const { name, email, phone, paymentMethod, deliveryMethod, province_name, district_name, commune_name, street } = req.body;
  //console.log(province_name, district_name, commune_name, street);
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
        province: province_name,
        district: district_name,
        commune: commune_name,
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
        province_name,
        district_name,
        commune_name,
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

exports.getOrders = async (req, res) => {
  try {
    const { orderType, duration, page = 1 } = req.query;
    //console.log(orderType, duration, page);
    const ITEMS_PER_PAGE = 8;

    let filterConditions = {};

    filterConditions = { userId: req.user.id }; // Filter orders by user ID

    // Add filters for orderType and duration
    if (orderType && orderType !== 'All orders') {
      filterConditions.status = orderType; // Adjust field name as per your schema
    }
    // Filter by duration if specified
    if (duration && duration !== 'All orders') {
      const now = new Date();
      const durationMap = {
        "this week": { $gte: new Date(now.setDate(now.getDate() - now.getDay())) }, // Start of this week
        "this month": { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }, // Start of this month
        "last 3 months": { $gte: new Date(now.getFullYear(), now.getMonth() - 3, 1) }, // Start of 3 months ago
        "last 6 months": { $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) }, // Start of 6 months ago
        "this year": { $gte: new Date(now.getFullYear(), 0, 1) }, // Start of this year
      };
      filterConditions.date = durationMap[duration]; // Assuming 'createdAt' is the date field
    }

    //console.log(filterConditions)

    const totalItems = await Order.countDocuments(filterConditions);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const orders = await Order.find(filterConditions)
      .sort({ date: -1 }) // Sort by createdAt in descending order (newest first)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);



    // Format orders before sending to the view
    const formattedOrders = orders.map(order => ({
      ...order._doc, // spread the existing fields
      date: formatDate(order.date), // format date
      id: formatOrderId(order.id), // shorten order ID
    }));

    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      // Respond with JSON for AJAX requests
      return res.json({
        orders: formattedOrders,
        totalPages,
        currentPage: Number(page),
      });
    }

    res.render('Order/order-list', {
      title: 'Order List',
      orders: formattedOrders,
      totalPages,
      currentPage: Number(page),
      orderType,
      duration,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching orders' });
  }
}


exports.getOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    console.log(order);

    if (!order) {
      return res.status(404).send('Product not found');
    }
    res.render('Order/order-detail', { title: `Order detail`, order});
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}

exports.cancelOrder = async (req, res) => {
  try {
    //console.log(req.params)
    const { orderId } = req.params;

    // Find the order by ID and ensure it belongs to the logged-in user
    const order = await Order.findOne({ _id: orderId, userId: req.user._id });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or you do not have permission to cancel it.' });
    }

    //console.log('Order:', order);

    // Check if the order is already completed or canceled
    if (order.status !== 'Pending' && order.status !== 'Shipped') {
      return res.status(400).json({ message: 'This order cannot be canceled.' });
    }

    // Update the order status to "Cancelled"
    order.status = 'Canceled';
    await order.save();

    // Respond with success message
    res.json({ message: 'Order canceled successfully!', success: true });

  } catch (err) {
    console.error('Error canceling order:', err);
    res.status(500).json({ message: 'An error occurred while canceling the order.' });
  }
};





const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatOrderId = (orderId) => {
  return orderId.slice(0, 8); // Take only the first 8 characters of the ID
};