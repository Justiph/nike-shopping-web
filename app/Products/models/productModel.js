const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  img: { type: [String] },
  price: { type: Number, required: true },
  desc: { type: String },
  gender: { type: String, enum: ['MEN', 'WOMEN', 'KIDS'] },
  category: { type: String },
  sizes: { type: [String] } 
});

module.exports = mongoose.model('Product', productSchema);
