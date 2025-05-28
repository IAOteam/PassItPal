import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings
} from '../controllers/listingController';

const router = Router();

// Public routes
router.get(
  '/',
  [
    query('locationName').optional().isString().trim().escape().withMessage('Location name must be a string.'), // Search by location name
    query('latitude').optional().isFloat().withMessage('Latitude must be a number.'),
    query('longitude').optional().isFloat().withMessage('Longitude must be a number.'),
    query('radiusKm').optional().isFloat({ min: 0.1 }).withMessage('Radius must be a positive number.'),
    query('cultPassType').optional().isString().trim().escape().withMessage('Cult Pass Type must be a string.'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a non-negative number.'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a non-negative number.'),
    query('minCredits').optional().isInt({ min: 0 }).withMessage('Min credits must be a non-negative integer.'), // Assuming credits are integers
    query('maxCredits').optional().isInt({ min: 0 }).withMessage('Max credits must be a non-negative integer.')  // Assuming credits are integers
  ],
  validate,
  getListings
);

// @route   GET /api/listings/my-listings
// @desc    Get all listings created by the logged-in user
// @access  Private (Seller only)
router.get(
  '/my-listings', // NEW route path
  protect, // Ensure only logged-in users can access
  authorizeRoles('seller'), // Only sellers can have listings to manage
  getMyListings //  controller function
);

router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid listing ID format.')
  ],
  validate,
  getListingById
);

// Protected routes (Seller only)
router.post(
  '/',
  protect,
  authorizeRoles('seller'),
  [
    body('cultPassType').notEmpty().withMessage('Cult Pass Type is required.'),
    body('expiryDate').isISO8601().toDate().withMessage('Valid expiry date is required (YYYY-MM-DD).'),
    body('askingPrice').isFloat({ min: 0 }).withMessage('Asking price must be a positive number.'),
    body('originalPrice').isFloat({ min: 0 }).withMessage('Original price must be a positive number.'),
    // body('availableCredits').optional().isString().trim().escape(),
    body('availableCredits').optional().isInt({ min: 0 }).withMessage('Available credits must be a non-negative integer.'),
    body('locationName').notEmpty().isString().trim().escape().withMessage('Location name is required.'), //  Required location name
    body('adImageBase64').optional().isString().withMessage('Ad image must be a base64 string.')
  ],
  validate,
  createListing
);
router.put(
  '/:id',
  protect,
  authorizeRoles('seller'),
  [
    param('id').isMongoId().withMessage('Invalid listing ID format.'),
    body('cultPassType').optional().notEmpty().withMessage('Cult Pass Type cannot be empty.'),
    body('expiryDate').optional().isISO8601().toDate().withMessage('Valid expiry date is required (YYYY-MM-DD).'),
    body('askingPrice').optional().isFloat({ min: 0 }).withMessage('Asking price must be a positive number.'),
    body('originalPrice').optional().isFloat({ min: 0 }).withMessage('Original price must be a positive number.'),
    // body('availableCredits').optional().isString().trim().escape(),
    body('availableCredits').optional().isInt({ min: 0 }).withMessage('Available credits must be a non-negative integer.'),
    body('locationName').optional().isString().trim().escape().withMessage('Location name must be a string.'), // New: Optional location name
    body('adImageBase64').optional().isString().withMessage('Ad image must be a base64 string.'),
    body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean.') // Allow seller to update availability
  ],
  validate,
  updateListing
);
router.delete(
  '/:id',
  protect,
  authorizeRoles('seller'),
  [
    param('id').isMongoId().withMessage('Invalid listing ID format.')
  ],
  validate,
  deleteListing
);

export default router;