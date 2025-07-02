// server/src/routes/adRoutes.ts

import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';
import { submitAdForReview } from '../controllers/adController';

const router = Router();

// This is a public route, no 'protect' middleware needed
router.post(
    '/submit',
    [
        body('sponsorName').notEmpty().withMessage('Sponsor name is required.'),
        body('adTitle').notEmpty().withMessage('Ad title is required.'),
        body('adDescription').notEmpty().withMessage('Description is required.'),
        body('targetUrl').isURL().withMessage('A valid target URL is required.'),
        body('durationDays').isInt({ min: 1 }).withMessage('Duration must be at least 1 day.'),
    ],
    validate,
    submitAdForReview
);

export default router;