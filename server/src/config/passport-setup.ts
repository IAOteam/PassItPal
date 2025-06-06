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
        console.log(`[Passport Google Strategy] Received callback at: ${new Date().toISOString()}`);
        console.time("GoogleStrategyVerifyCallback"); // Start timer for the whole callback

      try {
        // Log the profile to see what Google returns
        console.log('[Passport Google Strategy] Profile received from Google:', JSON.stringify(profile, null, 2));

        if (!profile.id) {
          return done(new Error('No Google profile ID received'), undefined);
        }
        if (!profile.emails || profile.emails.length === 0 || !profile.emails[0].value) {
            console.error('[Passport Google Strategy] Missing profile ID or email from Google.');
            console.timeEnd("GoogleStrategyVerifyCallback");
            return done(new Error('No email received from Google'), undefined);
        }

        const googleId = profile.id;
        const email = profile.emails[0].value;
        const isEmailVerifiedByGoogle = profile.emails[0].verified === true //|| profile.emails[0].verified === 'true';
        console.log(`[Passport Google Strategy] Processing for googleId: ${googleId}, email: ${email} at: ${new Date().toISOString()}`);
        console.time("FindUserByGoogleId");
        // 1. Try to find user by googleId
        let user = await User.findOne({ googleId: googleId });
        console.timeEnd("FindUserByGoogleId");
        if (user) {
          // User found with this Google ID
          console.log(`[Passport Google Strategy] User found by googleId: ${user.email}`);
          // Optionally update user fields like profilePictureUrl if they've changed in Google
          if (profile.photos && profile.photos.length > 0 && user.profilePictureUrl !== profile.photos[0].value) {
            user.profilePictureUrl = profile.photos[0].value;
          }
          // Ensure email is marked as verified if Google says so and it wasn't already
          if (isEmailVerifiedByGoogle && !user.isEmailVerified) {
            user.isEmailVerified = true;
          }
          if(user.isModified()){ // Only save if something actually changed
            console.time("SaveExistingUserGoogle");
            await user.save();
            console.timeEnd("SaveExistingUserGoogle");
          }
          console.timeEnd("GoogleStrategyVerifyCallback");
          return done(null, user);
        }

        // 2. If no user by googleId, try to find by email to link accounts
        console.log(`[Passport Google Strategy] No user by googleId. Trying email: ${email} at: ${new Date().toISOString()}`);
        console.time("FindUserByEmailGoogle");
        user = await User.findOne({ email: email });
        console.timeEnd("FindUserByEmailGoogle");

        if (user) {
          // User found by email - link Google ID to this existing account
          console.log(`[Passport Google Strategy] User found by email. Linking googleId for ${user.email} at: ${new Date().toISOString()}`);
          user.googleId = googleId;
          user.isEmailVerified = true; // Trust Google's email verification
          if (profile.photos && profile.photos.length > 0 && (!user.profilePictureUrl || user.profilePictureUrl.includes('default_avatar'))) {
            user.profilePictureUrl = profile.photos[0].value;
          }
          // If user had signed up with email/password, their username might already exist.
          // If not, and profile.displayName exists, we can use it.
          if (!user.username && profile.displayName) {
             console.time("CheckExistingUsernameGoogle");
            // Check if this displayName (username) is already taken by another user
            const existingUsername = await User.findOne({ username: profile.displayName, _id: { $ne: user._id } });
            console.timeEnd("CheckExistingUsernameGoogle");
            if (!existingUsername) {
                user.username = profile.displayName;
            } else {
                // Handle username conflict, e.g., append random digits or use email prefix
                user.username = email.split('@')[0] + Math.floor(Math.random() * 1000);
            }
          }
          console.time("SaveLinkedUserGoogle");
          await user.save();
          console.timeEnd("SaveLinkedUserGoogle");
          console.timeEnd("GoogleStrategyVerifyCallback");
          return done(null, user);
        }

        // 3. If no user by googleId or email, create a new user
        console.log(`[Passport Google Strategy] No existing user. Creating new user for ${email} at: ${new Date().toISOString()}`);
        let newUsername = profile.displayName || email.split('@')[0];
        console.time("CheckNewUsernameGoogle");
        const existingUsername = await User.findOne({ username: newUsername });
        console.timeEnd("CheckNewUsernameGoogle");
        if (existingUsername) {
            newUsername = email.split('@')[0] + Math.floor(Math.random() * 1000); // Simple way to make it unique
        }

        const newUser = new User({
          googleId: googleId,
          email: email,
          username: newUsername,
          isEmailVerified: true, // Email verified by Google
          profilePictureUrl: (profile.photos && profile.photos.length > 0) ? profile.photos[0].value : undefined,
          // 'role' will default to 'buyer' as per your User model, or you can set it explicitly
          // 'password' field will be empty as this is Google OAuth user
          role: 'buyer', // Explicitly set default role if needed, otherwise relies on schema default
          location: {
            type: 'Point',
            coordinates: [0, 0], // Default coordinates (e.g., [longitude, latitude])
            city: '' // Default city or leave empty if schema allows
          }
        });
        console.time("SaveNewUserGoogle");
        await newUser.save();
        console.timeEnd("SaveNewUserGoogle");
        console.log(`[Passport Google Strategy] New user created: ${newUser.email} at: ${new Date().toISOString()}`);
        console.timeEnd("GoogleStrategyVerifyCallback");
        return done(null, newUser);

      } catch (err) {
        console.error('[Passport Google Strategy] Error:', err, `at: ${new Date().toISOString()}`);
        console.timeEnd("GoogleStrategyVerifyCallback"); // Ensure timer ends on error too
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