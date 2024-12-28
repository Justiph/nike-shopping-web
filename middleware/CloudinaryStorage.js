const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); 

// Set up CloudinaryStorage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatars', // Cloudinary folder
    allowed_formats: ['jpg', 'jpeg', 'png'], // Allow specific formats
  },
});
  
const upload = multer({ storage });
  
module.exports = upload;