const rateLimit = require('express-rate-limit');

// Rate limiter middleware for Forgot Password
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 requests per IP within windowMs
  message: {
    message: 'Too many password reset requests. Please try again after 15 minutes.',
  },
  standardHeaders: true, // Include rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

module.exports = forgotPasswordLimiter;
