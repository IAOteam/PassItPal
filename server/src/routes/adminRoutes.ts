import { Router } from 'express';
import {
  getAllUsers,
  updateUserRole,
  toggleUserBlock,
  getAllListingsAdmin,
  toggleListingPromotion,
  deleteListingAdmin,
  getPlatformStats,

  listRoleChangeRequests,
  approveRoleChangeRequest,
  rejectRoleChangeRequest
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

// GET all pending role change requests
router.get('/role-requests', listRoleChangeRequests); // Example: /api/admin/role-requests?status=pending (query param handled in controller if needed)

// PUT to approve a role change request for a specific user
router.put(
  '/role-requests/:userId/approve',
  [
    param('userId').isMongoId().withMessage('Invalid user ID format.'),
    // body('notes').optional().isString().trim().escape() // Optional notes for approval
  ],
  validate,
  approveRoleChangeRequest
);

// PUT to reject a role change request for a specific user
router.put(
  '/role-requests/:userId/reject',
  [
    param('userId').isMongoId().withMessage('Invalid user ID format.'),
    body('notes').notEmpty().withMessage('Rejection notes are required.').isString().trim().escape()
  ],
  validate,
  rejectRoleChangeRequest
);


export default router;