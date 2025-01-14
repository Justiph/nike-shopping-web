const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    img: { type: [String] },
    price: { type: Number, required: true },
    salePrice: { type: Number },
    desc: { type: String },
    gender: { type: String, enum: ['MEN', 'WOMEN', 'KIDS'] },
    category: { type: String },
    sizes: { type: [String] },
    status: { type: String, enum: ['Out Of Stock', 'Suspend', 'On Stock'] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
