const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const passport = require('passport');
const { mergeCart } = require('../../Cart/controllers/cartController');
const nodemailer = require('nodemailer');
const Redis = require('ioredis');
// const redis = new Redis();
//const redis = new Redis({host : 'redisdb'});

// const redis = new Redis({
//   host: 'redisdb', // Hostname của dịch vụ Redis
//   port: 6379,      // Cổng Redis (mặc định là 6379)
// });

const redis = new Redis({
  host: 'redis.lptdevops.website',  // Đảm bảo tên miền đúng
  db: 0,                            // Mặc định DB 0
});

redis.ping()
  .then((result) => {
    console.log('Redis is connected:', result);  // Kết quả sẽ là "PONG" nếu kết nối thành công
  })
  .catch((error) => {
    console.error('Error connecting to Redis:', error);  // In ra lỗi nếu không kết nối được
  });

const crypto = require('crypto');
const logger = require('../../Log/logger');

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
      avatar: null,
      googleID: null,
      password: hashedPassword,
      role: role || "user",
      isActivated: false, // Not activated yet
      activationToken,
      status: "active",
      registrationDate: new Date(),
    });

    // Send activation email
    await sendActivationEmail(email, activationToken);

    // Respond with success message for AJAX
    return res.status(200).json({
      success: true,
      message: "Registration successful! Redirecting to login...",
      redirectUrl: "/auth/waiting-activation",
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
    console.log(res)
    // Handle other errors
    return res.status(500).json({
      success: false,
      error: "Server error: " + error.message,
    });
  }
};

function isPasswordValid(password) {
  const minLength = 8; // Minimum length requirement
  const hasUpperCase = /[A-Z]/.test(password); // At least one uppercase letter
  const hasNumber = /[0-9]/.test(password); // At least one number
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password); // At least one special character

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasNumber &&
    hasSpecialChar
  );
}


exports.login = async (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      console.error("Error during authentication:", err);
      if (req.xhr) {
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    if (!user) {
      console.log("No user found:", info);
      if (req.xhr) {
        return res.status(401).json({ error: info.message });
      }
    }

    // Retrieve the guest cart from Redis
    const redisKey = `guestCart:${req.sessionID}`;
    const sessionCartData = await redis.get(redisKey);
    const sessionCart = sessionCartData ? JSON.parse(sessionCartData) : null;

    req.login(user, async (err) => {
      if (err) {
        console.error("Error during login:", err);
        if (req.xhr) {
          return res.status(500).json({ error: "Internal server error" });
        }
        return next(err);
      }

      console.log("Login successful");
      logger.info({ message: `Login successfully ` });

      // Merge the guest cart into the user's cart
      if (sessionCart && sessionCart.products.length > 0) {
        await mergeCart(req, res, sessionCart);
      }

      // Clear the guest cart in Redis
      await redis.del(redisKey);

      if (req.xhr) {
        return res.status(200).json({ success: true, redirectUrl: "/" });
      }
    });
  })(req, res, next);
};

exports.googleCallback = async (req, res, next) => {
  try {
    // Fetch guest cart from Redis using session ID
    const redisKey = `guestCart:${req.sessionID}`;
    const cartData = await redis.get(redisKey);
    const sessionCart = cartData ? JSON.parse(cartData) : { products: [] };
    console.log("Redis sessionCart:", sessionCart);

    passport.authenticate("google", { failureRedirect: "/auth/login" }, async (err, user, info) => {
      if (err || !user) {
        return res.redirect("/auth/login");
      }

      req.login(user, async (err) => {
        if (err) {
          return res.status(500).json({ error: "Internal server error" });
        }

        // Merge Redis cart with logged-in user's cart
        if (sessionCart.products.length > 0) {
          await mergeCart(req, res, sessionCart);
        }

        // Remove guest cart from Redis after successful merge
        await redis.del(redisKey);

        res.redirect("/"); // Redirect after merging
      });
    })(req, res, next);
  } catch (err) {
    console.error("Error in Google callback:", err);
    res.status(500).send("Internal Server Error");
  }
};


exports.renderRegisterPage = (req, res) => {
  res.render('Auth/register', { title: 'Register' });
}  

exports.waitingActivation = (req, res) => {
  res.render('Auth/waiting-activation', { title: 'Waiting for Activation' });
}

exports.renderLoginPage = (req, res) => {
  res.render('Auth/login', { title: 'Login' });
}

exports.renderForgotPasswordPage = (req, res) => {
  res.render('Auth/forgot-password', { title: 'Forgot Password' });
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

    res.render('Auth/activate-success', { title: 'Account Activated' });
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

  // const activationLink = `${req.protocol}://${req.get(
  //   'host'
  // )}/auth/activate/${token}`;
  //const activationLink = `https://nikeyyy.onrender.com/auth/activate/${token}`;
  const activationLink = `https://nikeshopping.lptdevops.website/auth/activate/${token}`;
  //const activationLink = `http://localhost:5000/auth/activate/${token}`;

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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email);

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Lưu token vào Redis với TTL (10 phút)
    const userData = JSON.stringify({ userId: user.id, email: user.email });
    await redis.setex(`resetToken:${hashedToken}`, 600, userData); // 600 giây = 10 phút
    

    // Send email with reset link
    await sendPasswordResetEmail(email, resetToken, req);

    res.status(200).json({ message: 'Password reset email sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing your request.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, passwordConfirm } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Kiểm tra token trong Redis
    const userData = await redis.get(`resetToken:${hashedToken}`);
    if (!userData) {
      return res.render("auth/reset-password", {
        error: "Liên kết không hợp lệ hoặc đã hết hạn!",
      });
    }

    const { userId } = JSON.parse(userData);

    if (password !== passwordConfirm) {
      return res.render("auth/reset-password", {
        token,
        error: "Mật khẩu không khớp!",
      });
    }

    // Tìm người dùng và cập nhật mật khẩu
    const user = await User.findOne({_id: userId});
    if (!user) {
      return res.render("auth/reset-password", {
        error: "Người dùng không tồn tại!",
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    // Xóa token khỏi Redis
    await redis.del(`resetToken:${hashedToken}`);

    res.redirect("/auth/login");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing your request.' });
  }
};

const sendPasswordResetEmail = async (email, resetToken, req) => {
  // Create reset URL
  // const resetURL = `${req.protocol}://${req.get(
  //   'host'
  // )}/auth/reset-password/${resetToken}`;
  const resetURL = `https://nikeshopping.lptdevops.website/auth/reset-password/${resetToken}`;

  // Send email
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // Disable certificate validation
    },
  });

  const message = {
    to: email,
    subject: 'Reset Your Password',
    html: `
        <p>Hi,</p>
        <p>Click the below link to reset your password: </p>
        <a href="${resetURL}">${resetURL}</a>
        <p>The link will be expired in 10 mins.</p>
      `,
  };

  await transporter.sendMail(message);
};