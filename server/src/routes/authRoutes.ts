import { Router } from 'express';
import { body, param } from 'express-validator'; // param is not strictly needed here but keeping if future routes use it
import { validate } from '../middleware/validationMiddleware';
import { registerUser, loginUser, requestOtp, verifyOtpController, resendOtp, deleteOtp } from '../controllers/authController'; // Renamed verifyOtp to verifyOtpController to avoid conflict

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
      .isMobilePhone('any').withMessage('Please enter a valid mobile number.')
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
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits long.'),
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

// Delete OTP (if needed, e.g., for cleanup or invalid attempt)
router.delete(
  '/delete-otp',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
  ],
  validate,
  deleteOtp
);

export default router;