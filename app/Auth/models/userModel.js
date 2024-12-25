const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },  
  googleID: { type: String },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActivated: { type: Boolean, default: false }, // Track activation
  activationToken: { type: String }, // Store activation token
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  registrationDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
