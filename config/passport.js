const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userscheema')
const env = require('dotenv').config();

passport.serializeUser((user, done) => {
  done(null, user.id); // Store only user ID in the session
});

passport.deserializeUser(async (id, done) => {
  try {
      const user = await User.findById(id);
     
      done(null, user); // Attach the full user object to the request
  } catch (error) {
      done(error, null);
  }
});



passport.use(new GoogleStrategy ({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3001/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            return done(null, user); // User found, pass to serializeUser
        } else {
            // Create a new user if it doesn't exist
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
            });
            await user.save();

            return done(null, user); // Newly created user
        }
    } catch (error) {
        return done(error, null); // Pass the error to done
    }
}));


  passport.serializeUser((user,done)=>{

    done(null, user.id)
  });


  passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then(user=>{
        done(null,user)
    })
    .catch(err =>{
        done(err,null)
    })
  })


  module.exports = passport;;