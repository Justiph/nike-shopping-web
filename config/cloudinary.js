const cloudinary = require('cloudinary').v2;

// Set up Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Add Cloud Name from Cloudinary Dashboard
  api_key: process.env.CLOUDINARY_API_KEY,       // Add API Key from Cloudinary Dashboard
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

module.exports = cloudinary;