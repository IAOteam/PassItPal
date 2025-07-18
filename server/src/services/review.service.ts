import Review, { IReview } from '../models/Review';
import Order from '../models/Order';
import User from '../models/User';
import mongoose from 'mongoose';
import { NotificationService } from './notification.service';
import { toPlainObject } from '@/utils/mongooseUtils';

class HttpError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class ReviewService {
    /**
     * Submits a review for a completed order.
     * @param orderId The ID of the order being reviewed.
     * @param reviewerId The ID of the user submitting the review.
     * @param reviewerUsername The username of the reviewer.
     * @param reviewData The review content (rating and comment).
     * @returns The newly created review document.
     */
    public static async submitReview(
        orderId: string,
        reviewerId: string,
        reviewerUsername: string,
        reviewData: { rating: number; comment: string }
    ): Promise<Partial<IReview>> {
        const { rating, comment } = reviewData;

        const session = await mongoose.startSession();
        
        try {
            // All database operations will now happen within this transaction.
            let createdReview;
            await session.withTransaction(async () => {
                const order = await Order.findById(orderId).session(session);
                if (!order) {
                    throw new HttpError('Order not found.', 404);
                }

                const isParticipant = order.buyer.toString() === reviewerId || order.seller.toString() === reviewerId;
                if (!isParticipant) {
                    throw new HttpError('You are not authorized to review this order.', 403);
                }

                if (order.status !== 'completed') {
                    throw new HttpError('You can only review completed orders.', 400);
                }

                if (await Review.findOne({ order: orderId, reviewer: reviewerId }).session(session)) {
                    throw new HttpError('You have already submitted a review for this order.', 409);
                }

                const isBuyerReviewing = order.buyer.toString() === reviewerId;
                const revieweeId = isBuyerReviewing ? order.seller : order.buyer;
                const reviewerRole = isBuyerReviewing ? 'buyer' : 'seller';

                // --- Operation 1: Create the Review ---
                const newReview = new Review({
                    order: orderId, reviewer: reviewerId, reviewee: revieweeId,
                    rating, comment, roleAtTimeOfReview: reviewerRole,
                });
                // Note: We save using an array and pass the session.
                const savedReviews = await newReview.save({ session });
                createdReview = savedReviews;

                // ---  Update the User's Stats ---
                await this.updateUserReviewStats(revieweeId.toString(), session);

                // ---  Send Notification (can be inside or outside transaction) ---
                // It's often safe to send notifications after the transaction commits.
                // But for simplicity here, we'll keep it inside.
                await NotificationService.createAndEmitNotification(
                    revieweeId.toString(), 'message',
                    `You have received a new ${rating}-star review from ${reviewerUsername}.`,
                    { type: 'profile', id: revieweeId.toString() }
                );
            }); // The transaction is automatically committed here if everything succeeds.

            if (!createdReview) {
                // This case should not be reached if the transaction is successful, but it's a safeguard.
                throw new Error('Review creation failed within transaction.');
            }

            return toPlainObject<IReview>(createdReview);

        } catch (error: any) {
            // If any error was thrown inside the transaction, it's automatically aborted.
            console.error('Transaction aborted for submitReview:', error.message);
            // Re-throw the original error to be handled by the controller.
            throw error;
        } finally {
            // Always end the session after the operation is complete.
            await session.endSession();
        }
    }

    /**
     * Fetches all reviews for a specific user.
     * @param userId The ID of the user whose reviews are to be fetched.
     * @returns An array of review documents.
     */
    public static async getReviewsForUser(userId: string): Promise<Partial<IReview>[]> {
        const reviews = await Review.find({ reviewee: userId })
            .populate('reviewer', 'username profilePictureUrl')
            .sort({ createdAt: -1 });
        
        return reviews.map(review => toPlainObject<IReview>(review));
    }


    /**
     * A private helper method to recalculate and update a user's review stats.
     * @param userId The ID of the user whose stats need updating.
     * A private helper method to recalculate and update a user's review stats within a session.
     */
    private static async updateUserReviewStats(userId: string, session: mongoose.ClientSession): Promise<void> {
        const stats = await Review.aggregate([
            { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
            { $group: {
                _id: '$reviewee',
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 },
            }},
        ]).session(session); //  run the aggregation within the session.

        if (stats.length > 0) {
            const { averageRating, reviewCount } = stats[0];
            await User.findByIdAndUpdate(userId, {
                averageRating: parseFloat(averageRating.toFixed(2)),
                reviewCount: reviewCount,
            }, { session }); // Passing the session to the update operation.
        } else {
            await User.findByIdAndUpdate(userId, {
                averageRating: 0,
                reviewCount: 0,
            }, { session });
        }
    }
}
