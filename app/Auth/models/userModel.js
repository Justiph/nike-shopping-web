const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String, unique: true, sparse: true},
  password: { type: String },
  avatar: { type: String },  
  googleID: { type: String },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActivated: { type: Boolean, default: false }, // Track activation
  activationToken: { type: String }, // Store activation token
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  registrationDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
