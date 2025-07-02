import mongoose, { Schema, Document, Types } from 'mongoose'; // Ensure Types is imported
import { IUser } from './User';
interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}
export interface IListing extends Document {
  _id: Types.ObjectId; // Explicitly type _id as Mongoose ObjectId
  seller: Types.ObjectId ;
  cultPassType: string;
  
  expiryDate: Date;
  askingPrice: number;
  originalPrice: number;
  availableCredits?: number;
  city: string;
  latitude: number;
  longitude: number;
  location: IGeoPoint;
  adImageUrl?: string;
  isAvailable: boolean ;
  isPromoted: boolean; // Added for admin controls
  promotionExpiresAt?: Date;
  views: number;
  category: string; 
  description: string; 
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema: Schema = new Schema({
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cultPassType: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  askingPrice: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  availableCredits: { type: Number }, // e.g., "5 sessions", "unlimited"
  city: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  location: { // GeoJSON Point for geospatial queries
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  adImageUrl: { type: String },
  isAvailable: { type: Boolean, default: true },
  isPromoted: { type: Boolean, default: false }, // Default to false
  promotionExpiresAt: { type: Date, required: false },
  views: { type: Number, default: 0 },
  category: { type: String, required: true, index: true }, 
  description: { type: String, required: true, maxlength: 2000 }, 
  
},
 { timestamps: true });
 
// Geospatial index for location-based queries (already existed, which is good)
ListingSchema.index({ location: '2dsphere' });

// Compound index for the most common query: finding available, non-promoted listings sorted by date.
ListingSchema.index({ isAvailable: 1, isPromoted: 1, createdAt: -1 });

// Compound index to help with price sorting
ListingSchema.index({ isAvailable: 1, askingPrice: 1 });

// Index for city, which is often used as a filter
ListingSchema.index({ city: 1 });

// Text index to make searching by pass name (cultPassType) much faster
ListingSchema.index({ cultPassType: 'text' });

const Listing = mongoose.model<IListing>('Listing', ListingSchema);
export default Listing;