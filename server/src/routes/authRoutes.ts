import { Router } from 'express';
import { registerUser, loginUser, requestOtp, verifyOtp, resendOtp, deleteOtp } from '../controllers/authController';
import { body } from 'express-validator'; // Import body for validation
import { validate } from '../middleware/validationMiddleware'; // Import validation middleware

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
    body('latitude')
      .isFloat().withMessage('Latitude must be a valid number.'),
    body('longitude')
      .isFloat().withMessage('Longitude must be a valid number.'),
  ],
  validate, // Apply validation middleware
  registerUser
);

// Login User
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validate, // Apply validation middleware
  loginUser
);

// Request OTP (for mobile number verification)
router.post(
  '/request-otp',
  [
    body('mobileNumber')
      .isMobilePhone('any').withMessage('Please enter a valid mobile number.'),
    body('email')
      .isEmail().withMessage('Please enter a valid email address.'),
  ],
  validate,
  requestOtp
);

// Verify OTP
router.post(
  '/verify-otp',
  [
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits long.'),
    body('email').isEmail().withMessage('Please enter a valid email address.'),
  ],
  validate,
  verifyOtp
);

// Resend OTP
router.post(
  '/resend-otp',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
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