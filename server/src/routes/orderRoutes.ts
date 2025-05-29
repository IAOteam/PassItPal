// src/routes/orderRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import {
  initiateOrder,
  // getMyOrders, // Future: for buyer to see their orders
  // getListingOrders, // Future: for seller to see orders on their listings
  // updateOrderStatus // Future: for seller to accept/reject/complete orders
} from '../controllers/orderController'; // We'll create this controller next

const router = Router();

// @route   POST /api/orders/initiate/:listingId
// @desc    Initiate an order/make an offer on a listing
// @access  Private (Buyer only)
router.post(
  '/initiate/:listingId',
  protect,
  authorizeRoles('buyer'), // Only buyers can initiate orders
  [
    param('listingId').isMongoId().withMessage('Invalid listing ID format.'),
    body('offerPrice').isFloat({ min: 0 }).withMessage('Offer price must be a non-negative number.'),
    body('messageToSeller').optional().isString().trim().escape().withMessage('Message must be a string.')
  ],
  validate,
  initiateOrder
);

export default router;