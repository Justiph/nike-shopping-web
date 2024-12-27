const User = require('../../Auth/models/userModel');

exports.getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      res.render('Account/account', { title: 'Account', user: user }); // Render the profile view and pass user data
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).send('Internal Server Error');
    }
  };