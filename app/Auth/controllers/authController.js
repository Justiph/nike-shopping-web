const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const passport = require('passport');
const nodemailer = require('nodemailer');

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

    // Generate activation token
    const activationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
      isActivated: false, // Not activated yet
      activationToken,
    });

    // Send activation email
    await sendActivationEmail(email, activationToken);

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

exports.activateAccount = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ email: decoded.email, activationToken: token });
    if (!user) {
      return res.status(404).send('Invalid activation token.');
    }

    if (user.isActivated) {
      return res.status(400).send('Account is already activated.');
    }

    user.isActivated = true;
    user.activationToken = null; // Clear the token
    await user.save();

    res.send('Account activated successfully. You can now log in.');
  } catch (error) {
    res.status(400).send('Invalid or expired activation token.');
  }
};


async function sendActivationEmail(email, token) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // or any other email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // Allows less strict certificate validation
    },
  });

  const activationLink = `https://nikeyyy.onrender.com/auth/activate/${token}`;

  const mailOptions = {
    from: '"Nikeyyy" <your-email@gmail.com>',
    to: email,
    subject: 'Account Activation',
    html: `
      <h1>Welcome to Your App!</h1>
      <p>Click the link below to activate your account:</p>
      <a href="${activationLink}">${activationLink}</a>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Activation email sent successfully!");
  } catch (err) {
    console.error("Error sending email:", err);
  }
}