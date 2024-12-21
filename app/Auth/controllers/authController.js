const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const passport = require('passport');

exports.register = async (req, res) => {
  const { username, email, password, confirmPassword, role } = req.body;

  console.log("register", username, email, password, confirmPassword);

  if (password !== confirmPassword) {
    return res.status(400).render('Auth/register', {
      title: 'Register',
      error: "Passwords do not match",
      formData: { username, email } // Pass form data back to prefill the form
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

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "72h" }
    );

    //res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    // Redirect to login page after successful registration
    return res.redirect('/auth/login');
  } catch (error) {
    if (error.code === 11000 && error.keyValue.username) {
      return res.status(400).render('Auth/register', {
        title: 'Register',
        error: "Username already exists",
        formData: { email } // Prefill the email field only
      });
    }
    if (error.code === 11000 && error.keyValue.email) {
      return res.status(400).render('Auth/register', {
        title: 'Register',
        error: "Email already exists",
        formData: { username } // Prefill the username field only
      });
    }
    // Handle other errors
    return res.status(500).render('Auth/register', {
      title: 'Register',
      error: "Server error: " + error.message,
      formData: { username, email }
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