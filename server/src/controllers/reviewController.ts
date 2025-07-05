// server/src/controllers/reviewController.ts
import { Request, Response } from 'express';
import Review, { IReview } from '../models/Review';
import Order from '../models/Order';
import User from '../models/User';
import mongoose from 'mongoose';
import { createAndEmitNotification } from './notificationController';

// @route   POST /api/reviews/:orderId
// @desc    Submit a review for a completed order
// @access  Private
export const submitReview = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { rating, comment } = req.body;
  const reviewerId = req.user?._id;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // 1. Authorization Check: Ensure the reviewer was part of the order
    if (order.buyer.toString() !== reviewerId?.toString() && order.seller.toString() !== reviewerId?.toString()) {
      return res.status(403).json({ message: 'You are not authorized to review this order.' });
    }

    // 2. Status Check: Ensure the order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed orders.' });
    }

    // 3. Duplicate Check: Prevent a user from reviewing the same order twice
    const existingReview = await Review.findOne({ order: orderId, reviewer: reviewerId });
    if (existingReview) {
      return res.status(409).json({ message: 'You have already submitted a review for this order.' });
    }

    // 4. Determine who is being reviewed (the "reviewee")
    const isBuyerReviewing = order.buyer.toString() === reviewerId?.toString();
    const revieweeId = isBuyerReviewing ? order.seller : order.buyer;
    const reviewerRole = isBuyerReviewing ? 'buyer' : 'seller';

    // 5. Create and save the new review
    const newReview = new Review({
      order: orderId,
      reviewer: reviewerId,
      reviewee: revieweeId,
      rating,
      comment,
      roleAtTimeOfReview: reviewerRole,
    });
    await newReview.save();

    // 6. Update the reviewee's average rating and review count
    const stats = await Review.aggregate([
      { $match: { reviewee: new mongoose.Types.ObjectId(revieweeId.toString()) } },
      { $group: {
          _id: '$reviewee',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      const { averageRating, reviewCount } = stats[0];
      await User.findByIdAndUpdate(revieweeId, {
        averageRating: parseFloat(averageRating.toFixed(2)), // Round to 2 decimal places
        reviewCount: reviewCount
      });
    }

    // 7. Notify the user who was reviewed
    await createAndEmitNotification(
      revieweeId.toString(),
      'message', // or a new 'new_review' type
      `You have received a new ${rating}-star review from ${req.user?.username}.`,
      { type: 'profile', id: revieweeId.toString() } // Link object as required by notification system
    );

    res.status(201).json({ message: 'Review submitted successfully!', review: newReview });

  } catch (error: any) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Server error while submitting review.' });
  }
};

// @route   GET /api/reviews/user/:userId
// @desc    Get all reviews for a specific user
// @access  Public
export const getReviewsForUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const reviews = await Review.find({ reviewee: userId })
      .populate('reviewer', 'username profilePictureUrl') // Populate with public info
      .sort({ createdAt: -1 });

    if (!reviews) {
      return res.status(404).json({ message: 'No reviews found for this user.' });
    }

    res.status(200).json(reviews);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error while fetching reviews.' });
  }
};