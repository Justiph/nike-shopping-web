const User = require('../app/Auth/models/userModel'); // Adjust the path according to your project

const checkUserStatus = async (req, res, next) => {
  if (!req.user) {
    // User is not authenticated
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Find the user by ID
    const user = await User.findById(req.user._id);
    
    // Check if the account is inactive
    if (user.status === 'inactive') {
      // Destroy the session (log out the user)
      req.logout((err) => {
        if (err) return next(err); // Handle any logout errors
        req.session.destroy((err) => {
            if (err) {
              return res.status(500).send('Logout failed');
            }
      
            res.clearCookie('connect.sid');
            res.redirect('/account-banned'); // Redirect to a page indicating that the account is banned
        });
      });
    } else {
      return next();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'An error occurred while checking user status' });
  }
};

module.exports = checkUserStatus;
