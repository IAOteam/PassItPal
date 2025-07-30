// server/src/config/passport-setup.ts
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import User, { IUser } from '../models/User'; // Your User model

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_OAUTH_REDIRECT_URI) {
  throw new Error('Missing Google OAuth credentials or redirect URI in .env file');
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_OAUTH_REDIRECT_URI, // Matches what's in Google Console & .env
      scope: ['profile', 'email'], // Scopes you requested in Google Console
    },
    async (accessToken: string, refreshToken: string | undefined, profile: Profile, done: VerifyCallback) => {
      try {
        if (!profile.id) {
          return done(new Error('No Google profile ID received'), undefined);
        }
        if (!profile.emails || profile.emails.length === 0 || !profile.emails[0].value) {
            return done(new Error('No email received from Google'), undefined);
        }

        const googleId = profile.id;
        const email = profile.emails[0].value;

        // 1. Try to find user by googleId
        let user = await User.findOne({ googleId: googleId });
        if (user) {
          return done(null, user);
        }

        // 2. If no user by googleId, try to find by email to link accounts
        user = await User.findOne({ email: email });

        if (user) {
          // User found by email - link Google ID to this existing account
          user.googleId = googleId;
          user.isEmailVerified = true; // Trust Google's email verification
          user.authProvider = 'google'; // IMPORTANT: Update auth provider
          await user.save();
          return done(null, user);
        }

        // 3. If no user by googleId or email, create a new user
        let newUsername = profile.displayName || email.split('@')[0];
        const existingUsername = await User.findOne({ username: newUsername });
        if (existingUsername) {
            newUsername = email.split('@')[0] + Math.floor(Math.random() * 1000); // Simple way to make it unique
        }

        const newUser = new User({
          googleId: googleId,
          email: email,
          username: newUsername,
          isEmailVerified: true, // Email verified by Google
          authProvider: 'google', // IMPORTANT: Set auth provider for new Google users
          profilePictureUrl: (profile.photos && profile.photos.length > 0) ? profile.photos[0].value : undefined,
          role: 'buyer', 
          location: {
            type: 'Point',
            coordinates: [0, 0], 
            city: '' 
          }
        });
        await newUser.save();
        return done(null, newUser);

      } catch (err) {
        console.error('[Passport Google Strategy] Error:', err);
        return done(err as Error, undefined);
      }
    }
  )
);


/* 
---

Session Serialization/Deserialization (Commented Out): Since we are using JWTs for our own session management and not traditional server-side sessions with Passport for this API flow, passport.serializeUser and passport.deserializeUser are generally not needed for this specific Google OAuth strategy if the callback immediately issues a JWT. Passport's primary role here is to authenticate against Google and provide the profile.

---


Passport session serialization/deserialization (optional if not using sessions directly for this flow)
For API-based authentication (JWTs), we typically don't need to serialize/deserialize users into a session
after Passport authenticates them. Passport's job here is to verify the user with Google
and give us their profile; then our /callback route will issue our own JWTs.

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});*/

// Export the configured passport instance if you plan to import 'passport' directly elsewhere,
// or this file simply configures the global passport object by importing it.
// For clarity, we can just let this file execute to configure.
// No explicit export needed if 'passport' is imported and used directly in app.ts or routes.