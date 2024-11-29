const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const passport = require('passport');

exports.register = async (req, res) => {
  const { username, email, password, confirmPassword, role } = req.body;

  console.log("register", username, email, password, confirmPassword);

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "72h" }
    );

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

  
    
    // Redirect to login page after successful registration
    return res.redirect('/auth/login');  // Redirect to login page

    
  } catch (error) {
    if (error.code === 11000 && error.keyValue.username) {
      return res.status(400).json({ message: "Username đã tồn tại" });
    }
    if (error.code === 11000 && error.keyValue.email) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }
    // Lỗi khác
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

exports.login = async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    //console.log('Authenticate callback:', { err, user, info });
  
    if (err) {
      return next(err);
    }
  
    if (!user) {
      console.log('No user found:', info);
      return res.status(401).render('login', { 
        title: 'Login', 
        error: info.message 
      });
    }
  
    req.login(user, (err) => {
      if (err) {
        console.error('Error during login:', err);
        return next(err);
      }
  
      console.log('Login successful');
      return res.redirect('/');
    });
  })(req, res, next);
};

exports.renderRegisterPage = (req, res) => {
  res.render('Auth/register', { title: 'Register' });
}  

exports.renderLoginPage = (req, res) => {
  res.render('Auth/login', { title: 'Login' });
}

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout Error:', err);
      return res.status(500).send('Logout failed');
    }
    res.redirect('/auth/login'); // Redirect to login page after logout
  });
}