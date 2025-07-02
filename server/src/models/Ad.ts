// server/src/models/Ad.ts
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAd extends Document {
  sponsorName: string;
  adTitle: string;
  adDescription: string;
  imageUrl: string;
  targetUrl: string;
  locations: string[]; // Array of city names for geotargeting
  isActive: boolean;
  priority: number; // For sorting, higher number = higher priority
  createdAt: Date;
  updatedAt: Date;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  durationDays: number;
  price: number; // Price for the ad based on duration/type
  expiresAt?: Date; // The exact date the ad will expire
}

const AdSchema: Schema = new Schema({
  sponsorName: {
    type: String,
    required: true,
    trim: true,
  },
  adTitle: {
    type: String,
    required: true,
    trim: true,
  },
  adDescription: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  targetUrl: {
    type: String,
    required: true,
  },
  locations: { // Allows targeting ads to specific cities
    type: [String],
    default: [], // Empty array means the ad is global
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  priority: {
    type: Number,
    default: 1, // Default priority
  },
  approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
  durationDays: {
        type: Number,
        required: true,
        default: 7, // Default duration of 7 days
    },
  price: { type: Number, required: true },
  expiresAt: { type: Date },
}, {
  timestamps: true,
});

const Ad = mongoose.model<IAd>('Ad', AdSchema);

export default Ad;