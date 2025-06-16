// server/src/models/Review.ts
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReview extends Document {
  order: Types.ObjectId; // The specific order this review is for
  reviewer: Types.ObjectId; // The user who WROTE the review
  reviewee: Types.ObjectId; // The user who is BEING REVIEWED
  rating: number; // e.g., 1-5 stars
  comment?: string; // The text content of the review
  roleAtTimeOfReview: 'buyer' | 'seller'; // The role of the reviewer in this transaction
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  roleAtTimeOfReview: {
    type: String,
    enum: ['buyer', 'seller'],
    required: true,
  }
}, {
  timestamps: true,
});

// Create a compound index to prevent a user from reviewing the same order more than once.
ReviewSchema.index({ order: 1, reviewer: 1 }, { unique: true });

// Index to quickly fetch all reviews for a user
ReviewSchema.index({ reviewee: 1 });


const Review = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;