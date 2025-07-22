import mongoose, { Schema, Document, Types } from 'mongoose'; 
import { IUser } from './User';
import { ICategory } from './Category'; 
interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}
export type ListingStatus = 'available' | 'sold' | 'expired' | 'deactivated' | 'pending';

interface IAddress {
  street?: string;      // e.g., "123 Main St"
  suburb?: string;      // e.g., "Kukatpally"
  city: string;        // e.g., "Hyderabad"
  state: string;       // e.g., "Telangana"
  country: string;     // e.g., "India"
  postalCode?: string;
  fullAddress: string; // The full address returned by Google
}
export interface IListing extends Document {
  _id: Types.ObjectId; // Explicitly type _id as Mongoose ObjectId
  seller: Types.ObjectId | IUser;
  cultPassType: string;
  
  expiryDate: Date;
  askingPrice: number;
  originalPrice: number;
  displayLocation: string; // The concise location to show on the card, e.g., "Kukatpally"
  address: IAddress;         // The full, structured address object
  location: IGeoPoint;       // The GeoJSON coordinates for searching
  availableCredits?: number;
  city: string;
  latitude: number;
  longitude: number;
  adImageUrl?: string;
  // isAvailable: boolean ;
  status: ListingStatus;
  isPromoted: boolean; // Added for admin controls
  promotionExpiresAt?: Date;
  views: number;
  categories: Types.ObjectId[];
  description: string; 
  searchIndex: string;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema: Schema = new Schema({
    street: { type: String },
    suburb: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String },
    fullAddress: { type: String, required: true },
}, { _id: false });


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
  displayLocation: { type: String, required: true },
  address: { type: AddressSchema, required: true },
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
  // isAvailable: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['available', 'sold', 'expired', 'deactivated', 'pending'],
    default: 'available',
    index: true, // Add an index for faster queries on status
  },
  isPromoted: { type: Boolean, default: false }, // Default to false
  promotionExpiresAt: { type: Date, required: false },
  views: { type: Number, default: 0 },
  categories: [{ type: Schema.Types.ObjectId, ref: 'Category', required: true }],
  description: { type: String, required: true, maxlength: 2000 }, 
  searchIndex: { type: String, select: false },
  
},
 { timestamps: true });

 // Pre-save hook to automatically populate the searchIndex field
ListingSchema.pre('save', async function(next) {
    if (this.isModified('cultPassType') || this.isModified('description') || this.isModified('categories')) {
        await this.populate('categories');
        const categoryNames = (this.categories as ICategory[]).map(c => c.name).join(' ');
        this.searchIndex = `${this.cultPassType} ${this.description} ${categoryNames}`;
    }
    next();
});
 
// Geospatial index for location-based queries (already existed, which is good)
ListingSchema.index({ location: '2dsphere' });

// Compound index for the most common query: finding available, non-promoted listings sorted by date.
// ListingSchema.index({ isAvailable: 1, isPromoted: 1, createdAt: -1 });

// Compound index to help with price sorting
// ListingSchema.index({ isAvailable: 1, askingPrice: 1 });

ListingSchema.index({ status: 1, isPromoted: 1, createdAt: -1 });
ListingSchema.index({ status: 1, askingPrice: 1 });

// Index for city, which is often used as a filter
ListingSchema.index({ city: 1 });

// Text index to make searching by pass name (cultPassType) much faster
ListingSchema.index({ cultPassType: 'text' });

ListingSchema.index({ categories: 1 });

const Listing = mongoose.model<IListing>('Listing', ListingSchema);
export default Listing;