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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
ListingSchema.index({ location: '2dsphere' });
const Listing = mongoose.model<IListing>('Listing', ListingSchema);
export default Listing;