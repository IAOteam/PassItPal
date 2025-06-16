// server/src/routes/reviewRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { submitReview, getReviewsForUser } from '../controllers/reviewController';

const router = Router();

// @route   POST /api/reviews/:orderId
// @desc    Submit a review for a completed order
router.post(
  '/:orderId',
  protect, // User must be logged in to leave a review
  [
    param('orderId').isMongoId().withMessage('Invalid order ID format.'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
    body('comment').optional().isString().trim().isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters.'),
  ],
  validate,
  submitReview
);

// @route   GET /api/reviews/user/:userId
// @desc    Get all reviews for a specific user (publicly accessible)
router.get(
  '/user/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID format.'),
  ],
  validate,
  getReviewsForUser
);

export default router;