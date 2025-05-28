import { Router } from 'express';
import { getMyProfile, updateMyProfile, getUserProfileById,getAllUsers, blockUser } from '../controllers/userController';
import { protect,authorizeRoles  } from '../middleware/authMiddleware';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';

const router = Router();
// @route   GET /api/users/all
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get(
  '/all',
  protect,
  authorizeRoles('admin'),
  getAllUsers
  
);
// @route   PUT /api/users/block/:id
// @desc    Block/Unblock a user (Admin only)
// @access  Private (Admin)
router.put(
  '/block/:id',
  protect,
  authorizeRoles('admin'),
  [
    param('id').isMongoId().withMessage('Invalid user ID format.'),
    body('isBlocked').isBoolean().withMessage('isBlocked must be a boolean.')
  ],
  validate,
  blockUser
);
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