import { Router } from 'express';
import {
  getAllUsers,
  updateUserRole,
  toggleUserBlock,
  getAllListingsAdmin,
  toggleListingPromotion,
  deleteListingAdmin,
  getPlatformStats
} from '../controllers/adminController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';

const router = Router();

// All admin routes should be protected and restricted to 'admin' role
router.use(protect, authorizeRoles('admin'));

router.get('/users', getAllUsers);
router.put(
  '/users/:id/role',
  [
    param('id').isMongoId().withMessage('Invalid user ID format.'),
    body('role').isIn(['buyer', 'seller', 'admin']).withMessage('Role must be "buyer", "seller", or "admin".')
  ],
  validate,
  updateUserRole
);
router.put(
  '/users/:id/block',
  [
    param('id').isMongoId().withMessage('Invalid user ID format.')
  ],
  validate,
  toggleUserBlock
);

router.get('/listings', getAllListingsAdmin);
router.put(
  '/listings/:id/promote',
  [
    param('id').isMongoId().withMessage('Invalid listing ID format.')
  ],
  validate,
  toggleListingPromotion
);
router.delete(
  '/listings/:id',
  [
    param('id').isMongoId().withMessage('Invalid listing ID format.')
  ],
  validate,
  deleteListingAdmin
);

router.get('/stats', getPlatformStats);

export default router;