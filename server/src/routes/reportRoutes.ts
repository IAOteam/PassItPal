// server/src/routes/reportRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { submitReport } from '../controllers/reportController';

const router = Router();

// Define the valid reasons for a report, matching the schema enum
const validReasons = [
  'Misleading or Inaccurate Information',
  'Potential Scam or Fraud',
  'Inappropriate Content or Harassment',
  'Spam',
  'Item Not As Described',
  'Other'
];

// @route   POST /api/reports/:contentType/:contentId
// @desc    Submit a report
router.post(
  '/:contentType/:contentId',
  protect, // User must be logged in to submit a report
  [
    param('contentType')
      .isIn(['Listing', 'User'])
      .withMessage("Content type must be either 'Listing' or 'User'."),
    param('contentId')
      .isMongoId()
      .withMessage('A valid content ID must be provided.'),
    body('reason')
      .isIn(validReasons)
      .withMessage('A valid reason for the report is required.'),
    body('details')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Details cannot exceed 2000 characters.'),
  ],
  validate,
  submitReport
);

export default router;