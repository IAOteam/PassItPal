import { Router } from 'express';
import { 
  getAllUsers, 
  toggleUserBlock,
  updateUserRole,
  getAllListingsAdmin,
  deleteListingAdmin,
  toggleListingPromotion,
  getPlatformStats,
  getReports,
  updateReport,
  getAllAds,
  createAd,
  updateAd,
  deleteAd,
  approveAd,
  rejectAd
} from '../controllers/adminController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';

const router = Router();

// This middleware applies to ALL routes in this file.
// Every admin route is now automatically protected and requires an 'admin' role.
router.use(protect, authorizeRoles('admin'));

// --- User Management Routes ---
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-block', [
    param('id').isMongoId().withMessage('Invalid user ID format.')
  ], validate, toggleUserBlock);
router.put('/users/:id/role', [
    param('id').isMongoId().withMessage('Invalid user ID format.'),
    body('role').isIn(['buyer', 'seller', 'admin']).withMessage('Invalid role specified.')
  ], validate, updateUserRole);

// --- Listing Management Routes ---
router.get('/listings', getAllListingsAdmin);
router.delete('/listings/:id', [param('id').isMongoId()], validate, deleteListingAdmin);
router.put('/listings/:id/toggle-promote', [param('id').isMongoId()], validate, toggleListingPromotion);

// --- Ad Management Routes ---
router.get('/ads', getAllAds);
router.post('/ads', createAd);
router.put('/ads/:id', [param('id').isMongoId()], validate, updateAd);
router.delete('/ads/:id', [param('id').isMongoId()], validate, deleteAd);
router.put('/ads/:id/approve', [param('id').isMongoId()], validate, approveAd);
router.put('/ads/:id/reject', [param('id').isMongoId()], validate, rejectAd);

// --- Platform Stats & Reports ---
router.get('/stats', getPlatformStats);
router.get('/reports', getReports);
router.put('/reports/:id', [
    param('id').isMongoId().withMessage('Invalid report ID.'),
    body('status').notEmpty().withMessage('Status is required.')
  ], validate, updateReport);

export default router;
