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
      passReqToCallback: false, // We don't need to pass req since account linking is not required
      prompt: 'consent', // Prompt for consent each time
      scope: ['profile'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Log profile for debugging
        console.log('Google profile:', profile);

        // Check if a user with the Google ID already exists
        const existingUser = await User.findOne({ googleID: profile.id });

        if (existingUser) {
          // Log in the existing user
          return done(null, existingUser);
        }

        // Ensure Google provides an email
        // if (!profile.emails || profile.emails.length === 0) {
        //   throw new Error('No email returned by Google');
        // }
        // Validate profile completeness
        if (!profile.id) {
          console.error('Incomplete Google profile data:', profile);
          return done(new Error('Google profile is incomplete'), false);
        }

        // Create a new user if none exists
        const newUser = await User.create({
          username: profile.displayName || `GoogleUser${Date.now()}`,
          email: null,//profile.emails[0].value, // Use the primary email returned by Google
          password: null, // Password not needed for Google-authenticated users
          avatar: profile.photos?.[0]?.value || null, // Use Google profile photo if available
          googleID: profile.id,
          isActivated: true, // Google emails are verified by default
          activationToken: null,
          status: 'active',
          registrationDate: new Date(),
        });

        console.log('New user created:', newUser.username);

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
