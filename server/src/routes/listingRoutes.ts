import { Router } from 'express';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing
} from '../controllers/listingController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { body, param, query } from 'express-validator'; // Import validation functions
import { validate } from '../middleware/validationMiddleware';

const router = Router();

// Public routes
router.get(
  '/',
  [
    query('city').optional().isString().trim().escape().withMessage('City must be a string.'),
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
    body('city').notEmpty().withMessage('City is required.'),
    body('latitude').isFloat().withMessage('Latitude must be a valid number.'),
    body('longitude').isFloat().withMessage('Longitude must be a valid number.'),
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
    body('city').optional().notEmpty().withMessage('City cannot be empty.'),
    body('latitude').optional().isFloat().withMessage('Latitude must be a valid number.'),
    body('longitude').optional().isFloat().withMessage('Longitude must be a valid number.'),
    body('adImageBase64').optional().isString().withMessage('Ad image must be a base64 string.')
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