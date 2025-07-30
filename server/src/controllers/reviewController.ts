import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';

const sendSuccess = (res: Response, message: string, data: object = {}, statusCode = 200) => {
    res.status(statusCode).json({ message, ...data });
};

const sendError = (res: Response, error: any, defaultMessage: string) => {
    console.error(`Error in ReviewController: ${error.message}`);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || defaultMessage });
};

/**
 * @route   POST /api/reviews/:orderId
 * @desc    Submit a review for a completed order
 * @access  Private
 */
export const submitReview = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { rating, comment } = req.body;
        const reviewerId = req.user?._id.toString();
        const reviewerUsername = req.user?.username;

        if (!reviewerId || !reviewerUsername) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }

        const review = await ReviewService.submitReview(orderId, reviewerId, reviewerUsername, { rating, comment });
        sendSuccess(res, 'Review submitted successfully!', { review }, 201);

    } catch (error: any) {
        sendError(res, error, 'Server error while submitting review.');
    }
};

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get all reviews for a specific user
 * @access  Public
 */
export const getReviewsForUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const reviews = await ReviewService.getReviewsForUser(userId);
        res.status(200).json(reviews);
    } catch (error: any) {
        sendError(res, error, 'Server error while fetching reviews.');
    }
};
