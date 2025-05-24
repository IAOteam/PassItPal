import { Router } from 'express';
import { getMyProfile, updateMyProfile, getUserProfileById } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';

const router = Router();

// Public route to view any user's basic profile
router.get(
  '/profile/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID format.')
  ],
  validate,
  getUserProfileById
);

// Protected routes for the logged-in user's own profile
router.get('/me', protect, getMyProfile);
router.put(
  '/profile',
  protect,
  [
    body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.').trim().escape(),
    body('email').optional().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('mobileNumber').optional().isMobilePhone('any').withMessage('Please enter a valid mobile number.'),
    body('city').optional().notEmpty().withMessage('City cannot be empty.'),
    body('latitude').optional().isFloat().withMessage('Latitude must be a valid number.'),
    body('longitude').optional().isFloat().withMessage('Longitude must be a valid number.'),
    body('profilePictureBase64').optional().isString().withMessage('Profile picture must be a base64 string.')
  ],
  validate,
  updateMyProfile
);

export default router;