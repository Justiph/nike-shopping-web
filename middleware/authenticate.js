module.exports = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();  // Proceed to the next route handler if the user is authenticated
    }
    // Redirect to login page if not authenticated
    res.redirect('/cart');
};
  