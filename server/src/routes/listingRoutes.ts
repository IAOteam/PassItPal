import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing
} from '../controllers/listingController';

const router = Router();

// Public routes
router.get(
  '/',
  [
    query('locationName').optional().isString().trim().escape().withMessage('Location name must be a string.'), // New: Search by location name
    query('latitude').optional().isFloat().withMessage('Latitude must be a number.'),
    query('longitude').optional().isFloat().withMessage('Longitude must be a number.'),
    query('radiusKm').optional().isFloat({ min: 0.1 }).withMessage('Radius must be a positive number.')
  ],
  validate,
  getListings
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
    body('availableCredits').optional().isString().trim().escape(),
    body('locationName').notEmpty().isString().trim().escape().withMessage('Location name is required.'), // New: Required location name
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
    body('availableCredits').optional().isString().trim().escape(),
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