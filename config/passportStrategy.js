const LocalStrategy = require('passport-local').Strategy;
const bcryptjs = require('bcryptjs');
const passport = require('passport');
const User = require('../app/Auth/models/userModel'); 

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy({usernameField: "email"}  ,async (email, password, done) => {
    //console.log(`Authenticating user: ${email}`);
    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.log('User not found');
        return done(null, false, { message: 'Invalid username.' });
      }

      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        console.log('Password mismatch');
        return done(null, false, { message: 'Invalid password.' });
      }

      //console.log('User authenticated successfully:', user.username);
      return done(null, user);
    } catch (err) {
      console.error('Error during authentication:', err);
      return done(err);
    }
  })
);
// Serialize user for session management
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user for session management
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
