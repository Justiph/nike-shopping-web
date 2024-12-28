const express = require('express');
const path = require('path');
const fs = require('fs');
const Product = require('./app/Products/models/productModel');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');
const cors = require('cors');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const session = require('express-session')
const passport = require('./config/passportStrategy');
const multer = require('multer');
//const upload = multer();

// const { v2: cloudinary } = require("cloudinary");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();


const app = express();

// Routes
const homeRoutes = require('./app/Home/routes/homeRoutes');
const productRoutes = require('./app/Products/routes/productRoutes');
const reviewRoutes = require('./app/Review/routes/reviewRoutes');
const authRoutes = require('./app/Auth/routes/authRoutes');
const cartRoutes = require('./app/Cart/routes/cartRoutes');
const aboutRoutes = require('./app/About/routes/aboutRoutes');
const contactRoutes = require('./app/Contact/routes/contactRoutes');
const accountRoutes = require('./app/Account/routes/accountRoutes');

// Middlewares
app.use(express.static('src'));
app.use(cookieParser());


app.set('trust proxy', 1); // Trust the first proxy

// Initialize passport middleware
app.use(session({
  secret: 'your_secret_key', // Replace with a strong secret
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DB_URI, // MongoDB URI
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.USE_HTTPS === 'true',
    maxAge: 1000 * 60 * 60, // 1 hour
  },
}));
app.use(passport.initialize());
app.use(passport.session());
//app.use(upload.none());

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// Setup express.json() and url encoding
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Connect to the database and insert sample data if no products exist
connectDB()
  .then(async () => {
    try {
      const count = await Product.countDocuments({});
      if (count === 0) {
        const data = JSON.parse(fs.readFileSync('./data/products.json', 'utf-8'));
        await Product.insertMany(data.products);
        console.log('Sample data inserted');
      }
    } catch (err) {
      console.error('Error inserting sample data:', err);
    }
  })
  .catch((error) => console.error('MongoDB connection error:', error));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', homeRoutes);
app.use(productRoutes);
app.use('/review', reviewRoutes);
app.use('/auth', authRoutes);
app.use('/cart', cartRoutes);
app.use(aboutRoutes);
app.use(contactRoutes);
app.use(accountRoutes);

// Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// Set up Multer with Cloudinary storage
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "uploads", // Specify the folder name in Cloudinary
//     allowed_formats: ["jpg", "jpeg", "png"], // Allowed file formats
//   },
// });

// const upload = multer({ storage });

// Handle image upload
// app.post("/upload", upload.single("image"), (req, res) => {
//   if (req.file) {
//     res.json({
//       message: "Image uploaded successfully!",
//       imageUrl: req.file.path, // URL of the uploaded image in Cloudinary
//     });
//   } else {
//     res.status(400).json({ error: "No file uploaded" });
//   }
// });

//test
app.get('/api/current_user', (req, res) => {
  res.send(req.user);
});


module.exports = app;
