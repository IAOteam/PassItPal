// src/routes/orderRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import {
  initiateOrder,
  getMyOrders, //  for buyer to see their orders
  getListingOrders, // for seller to see orders on their listings
  updateOrderStatus // for seller to accept/reject/complete orders
} from '../controllers/orderController'; 

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


// @route   GET /api/orders/seller
// @desc    Get all orders for listings owned by the logged-in seller
// @access  Private (Seller only)
router.get(
  '/seller',
  protect,
  authorizeRoles('seller'), // Only sellers can view orders on their listings
  getListingOrders
);


// @route   GET /api/orders/me
// @desc    Get all orders initiated by the logged-in buyer
// @access  Private (Buyer only)
router.get(
  '/me',
  protect,
  authorizeRoles('buyer'), // Only buyers can view their own orders
  getMyOrders
);

// src/routes/orderRoutes.ts (add this route)

// @route   PUT /api/orders/:orderId/status
// @desc    Update the status of an order (e.g., accept, reject, complete)
// @access  Private (Seller only)
router.put(
  '/:orderId/status',
  protect,
  authorizeRoles('seller'), // Only sellers can update order status
  [
    param('orderId').isMongoId().withMessage('Invalid order ID format.'),
    body('status').isIn(['accepted', 'rejected', 'completed']).withMessage('Invalid order status provided.')
  ],
  validate,
  updateOrderStatus
);
export default router;