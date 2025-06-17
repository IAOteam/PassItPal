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
}, {
  timestamps: true,
});

const Ad = mongoose.model<IAd>('Ad', AdSchema);

export default Ad;