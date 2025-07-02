import { Router } from 'express';
import { body } from 'express-validator';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { createRazorpayOrder, verifyPayment } from '../controllers/paymentController';
import { createAdPaymentOrder, verifyAdPayment } from '../controllers/paymentController';

const router = Router();

// All payment routes should be protected and only accessible by sellers
router.use(protect, authorizeRoles('seller'));

// @route   POST /api/payments/create-order
// @desc    Create a Razorpay order for promoting a listing
router.post(
  '/create-order',
  [
    body('listingId').isMongoId().withMessage('A valid listing ID is required.'),
    body('amount').isNumeric().withMessage('A valid amount is required.'),
  ],
  validate,
  createRazorpayOrder
);

// @route   POST /api/payments/verify
// @desc    Verify the payment signature and update the listing
router.post(
  '/verify',
  [
    body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required.'),
    body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required.'),
    body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required.'),
    body('listingId').isMongoId().withMessage('A valid listing ID is required.'),
  ],
  validate,
  verifyPayment
);
// These routes are public because the advertiser is not a logged-in user.
// The adId provides enough context and security for this flow.
router.post('/ads/:adId/create-order', createAdPaymentOrder);
router.post('/ads/verify', verifyAdPayment);
export default router;
