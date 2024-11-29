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
const app = express();

// Routes
const homeRoutes = require('./app/Home/routes/homeRoutes');
const productRoutes = require('./app/Products/routes/productRoutes');
const authRoutes = require('./app/Auth/routes/authRoutes');
const cartRoutes = require('./app/Cart/routes/cartRoutes');
const aboutRoutes = require('./app/About/routes/aboutRoutes');
const contactRoutes = require('./app/Contact/routes/contactRoutes');

// Middlewares
app.use(express.static('src'));
app.use(cookieParser());

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
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60, // 1 hour
  },
}));
app.use(passport.initialize());
app.use(passport.session());


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
app.use('/auth', authRoutes);
app.use(cartRoutes);
app.use(aboutRoutes);
app.use(contactRoutes);


module.exports = app;
