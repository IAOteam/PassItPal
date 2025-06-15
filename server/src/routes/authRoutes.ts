import { Router } from 'express';
import passport from 'passport';
import { body, param } from 'express-validator'; // param is not strictly needed here but keeping if future routes use it
import { validate } from '../middleware/validationMiddleware';
import { 
  registerUser, 
  loginUser, 
  requestOtp, 
  verifyOtpController, 
  resendOtp, 
  // deleteOtp,
  forgotPasswordRequestOtp,
  verifyPasswordResetOtpAndGenerateToken,
  resetPassword,
  changePassword ,
  refreshAccessToken, 
  logoutUser,
  googleOAuthCallbackController
} from '../controllers/authController'; // Renamed verifyOtp to verifyOtpController to avoid conflict
import { protect } from '../middleware/authMiddleware';
const router = Router();

// Register User
router.post(
  '/register',
  [
    body('email')
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('role')
      .isIn(['buyer', 'seller']).withMessage('Role must be either "buyer" or "seller".'),
    body('mobileNumber')
      .optional() // Optional for buyer
      .isMobilePhone('any', { strictMode: false }).withMessage('Please enter a valid mobile number.')
      .if(body('role').equals('seller')).notEmpty().withMessage('Seller must provide a mobile number.'),
    body('username')
      .optional() // Optional for seller
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.')
      .if(body('role').equals('buyer')).notEmpty().withMessage('Buyer must provide a username.'),
    body('city')
      .notEmpty().withMessage('City is required.'),
    // Latitude and Longitude are now optional for registration as they will be derived from city if needed
    // The client will ideally send these, but the backend can also derive from city
    body('latitude')
      .optional().isFloat().withMessage('Latitude must be a valid number.'),
    body('longitude')
      .optional().isFloat().withMessage('Longitude must be a valid number.'),
  ],
  validate,
  registerUser
);

// Login User
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validate,
  loginUser
);

router.post('/refresh-token', refreshAccessToken);

router.post('/logout', protect, logoutUser);

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'], // Must match scopes configured in passport-setup.ts and Google Console
    session: false, // We are using JWTs, not sessions managed by Passport itself for this
  })
);

// Google OAuth callback route
// Google will redirect the user to this URL after they authenticate with Google.
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_auth_failed_passport`, // Redirect to frontend login on failure by Passport strategy
    session: false, // We are using JWTs
  }),
  googleOAuthCallbackController // Our custom controller to handle post-successful-Passport-auth
);

// Request OTP (for email or mobile number verification)
router.post(
  '/request-otp',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('type').isIn(['email', 'mobile']).withMessage('OTP type must be "email" or "mobile".'),
  ],
  validate,
  requestOtp
);

// Verify OTP
router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('otp').isString().isLength({ min: 6, max: 6 }).withMessage('OTP must be a 6-digit string.'),
    body('type').isIn(['email', 'mobile']).withMessage('OTP type must be "email" or "mobile".'),
  ],
  validate,
  verifyOtpController // Use the renamed controller function
);

// Resend OTP
router.post(
  '/resend-otp',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('type').isIn(['email', 'mobile']).withMessage('OTP type must be "email" or "mobile".'),
  ],
  validate,
  resendOtp
);
router.post('/forgot-password-request-otp',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.')
  ],
  validate,
  forgotPasswordRequestOtp
);

router.post('/verify-password-reset-otp',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('otp').isString().isLength({ min: 6, max: 6 }).withMessage('OTP must be a 6-digit string.')
  ],
  validate,
  verifyPasswordResetOtpAndGenerateToken);
router.put('/reset-password', 
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('resetToken').notEmpty().withMessage('Reset token is required.'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long.')
  ],
  validate,
  resetPassword);

router.put('/change-password', 
  protect, 
  [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long.')
  ],
  validate,
  changePassword);

// Delete OTP (if needed, e.g., for cleanup or invalid attempt)
// router.delete(
//   '/delete-otp',
//   [
//     body('email').isEmail().withMessage('Please enter a valid email address.'),
//   ],
//   validate,
//   deleteOtp
// );


export default router;