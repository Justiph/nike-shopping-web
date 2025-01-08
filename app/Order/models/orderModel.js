const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    products: [
        {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        size: { type: String },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        },
    ],
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    deliveryMethod: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
        province: { type: String, required: true },
        district: { type: String, required: true },
        commune: { type: String, required: true },
        street: { type: String, required: true }, // Detailed address field
    },
    paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered'], default: 'Pending' },
    date: { type: Date, default: Date.now },
    deliverDate: { type: Date },
});

module.exports = mongoose.model('Order', orderSchema);
