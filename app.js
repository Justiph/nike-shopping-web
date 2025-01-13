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
const sqlite3 = require('sqlite3').verbose();

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
const orderRoutes = require('./app/Order/routes/orderRoutes');

// Middlewares
app.use(express.static('src'));
app.use(cookieParser());


app.set('trust proxy', 1); // Trust the first proxy

// Initialize passport middleware
app.use(session({
  secret: 'your_secret_key', // Replace with a strong secret
  resave: false,
  saveUninitialized: true,
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
app.use('/order', orderRoutes);

//test
app.get('/api/current_user', (req, res) => {
  res.send(req.user);
});

// app.get('/test-session', (req, res) => {
//   console.log('Session Cart:', req.session.cart);
//   res.send('Session test complete');
// });

// Use absolute path to ensure SQLite can locate the database file correctly
const dbPath = path.join(__dirname, 'public/assets/data/administrative.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Database opened successfully');
  }
});

// API to fetch provinces
app.get('/api/provinces', (req, res) => {
  db.all('SELECT code, name FROM provinces', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// API to fetch districts based on province code
app.get('/api/districts', (req, res) => {
  const { provinceCode } = req.query;
  db.all(
    'SELECT code, name FROM districts WHERE province_code = ?',
    [provinceCode],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});

// API to fetch wards based on district code
app.get('/api/wards', (req, res) => {
  const { districtCode } = req.query;
  db.all(
    'SELECT code, name FROM wards WHERE district_code = ?',
    [districtCode],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});

module.exports = app;
