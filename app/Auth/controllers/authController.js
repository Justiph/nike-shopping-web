const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const passport = require('passport');

exports.register = async (req, res) => {
  const { username, email, password, confirmPassword, role } = req.body;

  //console.log("register", username, email, password, confirmPassword);

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: "Passwords do not match",
    });
  }

  try {
    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    // Respond with success message for AJAX
    return res.status(200).json({
      success: true,
      message: "Registration successful! Redirecting to login...",
      redirectUrl: "/auth/login",
    });
  } catch (error) {
    if (error.code === 11000 && error.keyValue.username) {
      return res.status(400).json({
        success: false,
        error: "Username already exists",
      });
    }
    if (error.code === 11000 && error.keyValue.email) {
      return res.status(400).json({
        success: false,
        error: "Email already exists",
      });
    }
    // Handle other errors
    return res.status(500).json({
      success: false,
      error: "Server error: " + error.message,
    });
  }
};


exports.login = async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error('Error during authentication:', err);
      if (req.xhr) {
        return res.status(500).json({ error: "Internal server error" });
      }
      //return next(err);
    }

    if (!user) {
      console.log('No user found:', info);
      if (req.xhr) {
        return res.status(401).json({ error: info.message });
      }
      // return res.status(401).render('Auth/login', { 
      //   title: 'Login', 
      //   error: info.message 
      // });
    }

    req.login(user, (err) => {
      if (err) {
        console.error('Error during login:', err);
        if (req.xhr) {
          return res.status(500).json({ error: "Internal server error" });
        }
        return next(err);
      }

      console.log('Login successful');
      if (req.xhr) {
        return res.status(200).json({ success: true, redirectUrl: '/' });
      }
      //return res.redirect('/');
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
      return next(err);
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send('Logout failed');
      }

      res.clearCookie('connect.sid');
      res.redirect('/auth/login'); // Redirect to login page after logout
    });
  });
}