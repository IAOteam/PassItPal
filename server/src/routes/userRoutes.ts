import { Router } from 'express';
import { 
  getMyProfile, 
  updateMyProfile, 
  getUserProfileById,
  switchUserRole,
  addSavedListing, 
  removeSavedListing,
  getMyPopulatedProfile,
} from '../controllers/userController';
import { protect,authorizeRoles  } from '../middleware/authMiddleware';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';
import { getAllUsers } from '@/controllers/adminController';


const router = Router();
// @route   GET /api/users/me
// @desc    Get current authenticated user's profile
// @access  Private
// router.get('/me', protect, getMe);

// @route   PUT /api/users/me
// @desc    Update current authenticated user's profile
// @access  Private
// router.put('/me', 
//   protect,
//   [ // keeping existing validation rules for profile update
//     body('username').optional().isLength({ min: 3 }).trim().escape(),
//     body('mobileNumber').optional().isMobilePhone('any', { strictMode: false }), // made strictMode false for more flexibility
//     body('city').optional().notEmpty(),
//     // ... other validation rules for profile update in future 
//   ],
//   validate,
//   updateMe
// ); 

router.post(
  '/me/request-role-change',
  protect, // User must be logged in
  [
    body('newRole').isIn(['buyer', 'seller']).withMessage('Requested role must be either "buyer" or "seller".')
  ],
  validate, // Use validation middleware
  switchUserRole
);

router.post('/me/saved/:listingId', protect, [param('listingId').isMongoId()], validate, addSavedListing);


router.delete('/me/saved/:listingId', protect, [param('listingId').isMongoId()], validate, removeSavedListing);


// @route   GET /api/users/all
// @desc    Get all users (Admin only)
// @access  Private (Admin)
// router.get(
//   '/all',
//   protect,
//   authorizeRoles('admin'),
//   getAllUsers
  
// );
// @route   PUT /api/users/block/:id
// @desc    Block/Unblock a user (Admin only)
// @access  Private (Admin)
// router.put(
//   '/block/:id',
//   protect,
//   authorizeRoles('admin'),
//   [
//     param('id').isMongoId().withMessage('Invalid user ID format.'),
//     body('isBlocked').isBoolean().withMessage('isBlocked must be a boolean.')
//   ],
//   validate,
//   blockUser
// );

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
router.get('/me/profile/populated', protect, getMyPopulatedProfile);

export default router;