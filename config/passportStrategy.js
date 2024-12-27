const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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
        return done(null, false, { message: 'Invalid email or password.' });
      }

      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        console.log('Password mismatch');
        return done(null, false, { message: 'Invalid email or password.' });
      }

      if (!user.isActivated) {
        console.log('Account not activated');
        return done(null, false, { message: 'Account not activated. Please check your email.' });
      }

      if (user.status === 'inactive') {
        console.log('Account is inactive');
        return done(null, false, { message: 'Account is inactive. Please contact support.' });
      }      

      //console.log('User authenticated successfully:', user.username);
      return done(null, user);
    } catch (err) {
      console.error('Error during authentication:', err);
      return done(err);
    }
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      passReqToCallback: true, // Allows passing `req` to the callback
      prompt: 'consent', // Force re-prompt for permissions
    },
    async (req, accessToken, refreshToken, profile, done) => {
      console.log('Access token:', accessToken);
      try {
        // Check if the user is trying to link an account
        if (req.user) {
          // Logged-in user is trying to link Google account
          const currentUser = req.user;
          console.log('current user:', currentUser);
          // Ensure no other account is already using the same Google ID
          const existingGoogleAccount = await User.findOne({ googleID: profile.id });
          if (existingGoogleAccount) {
            return done(null, false, { message: 'Google account is already linked to another user.' });
          }

          // Link Google account to the current user
          currentUser.googleID = profile.id;
          await currentUser.save();

          return done(null, currentUser); // Successfully linked
        }

        // If not linking, proceed with normal Google Sign-In flow
        const existingUser = await User.findOne({ googleID: profile.id });

        if (existingUser) {
          return done(null, existingUser); // Log in existing user
        }

        if (!profile.emails || profile.emails.length === 0) {
          throw new Error('No email returned by Google');
        }

        // Create a new user if none exists
        const newUser = await User.create({
          username: profile.displayName || `GoogleUser${Date.now()}`,
          email: null,
          password: null,
          avatar: profile.photos?.[0]?.value || null,
          googleID: profile.id,
          isActivated: true, // Google email is verified
          activationToken: null,
          status: 'active',
          registrationDate: new Date(),
        });

        return done(null, newUser);
      } catch (err) {
        return done(err, false);
      }
    }
  )
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
