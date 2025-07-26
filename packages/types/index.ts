// packages/types/index.ts

// The user object shape the frontend will work with.
// It's a subset of the backend model, excluding sensitive data.
export type IUser = {
  _id: string;
  googleId?: string;
  email: string;
  username: string;
  role: 'buyer' | 'seller' | 'admin';
  authProvider: 'local' | 'google'; 
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  isBlocked: boolean; 
  city?: string;
  mobileNumber?: string;
  profilePictureUrl?: string;
  averageRating?: number;
  reviewCount?: number;
  savedListings?: (string | Partial<IListing>)[];
  requestedRole?: 'buyer' | 'seller';
  roleRequestStatus?: 'pending' | 'approved' | 'rejected';
  roleReviewNotes?: string;
  monthlyListingCount?: number;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshToken?: string;
  otp?: string;
  otpExpiry?: Date;
  otpPurpose?: 'verification' | 'password_reset';
  otpVerifiedAt?: Date;
  latitude?: number;
  longitude?: number;
};

export type IAddress = {
  street?: string;
  suburb?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  fullAddress: string;
};

export type IGeoPoint = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  
};

// Define the shape of a Category object for the frontend.
export type ICategory = {
  _id: string;
  name: string;
  createdBy: string; // To track who created custom categories
  createdAt: Date;
  updatedAt: Date;
};

// Represents a listing, populated with seller info
export type IListing = {
  _id: string ;
  seller: IUser;
  cultPassType: string;
  description: string;
  // Update categories to reflect that it can be an array of unpopulated IDs (strings)
  // or an array of populated ICategory objects. This resolves the 'never' type error.
  categories: (string | ICategory)[]; 
  askingPrice: number;
  originalPrice: number;
  displayLocation: string;
  city: string;
  latitude: number;
  longitude: number;
  isPromoted: boolean;
  status: 'available' | 'sold' | 'expired' | 'deactivated' | 'pending';
  images?: string[];
  adImageUrl?: string;
  expiryDate: string;
  availableCredits?: number;
  views: number;
  promotionExpiresAt?: Date;
  createdAt: string;
  updatedAt: string;
};

export type IOrder = {
    _id: string;
    listing: Pick<IListing, '_id' | 'cultPassType' | 'adImageUrl'>;
    seller: Pick<IUser, '_id' | 'username'>;
    buyer: Pick<IUser, '_id' | 'username'>;
    offerPrice: number;
    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
    createdAt: string; // ISO Date String
};

// This is a more specific type for participants in a conversation list
export type IParticipant = {
   _id: string;
   username: string;
   profilePictureUrl?: string;
};

// For the full conversation object
export type IConversation = {
  _id: string;
  participants: IParticipant[];
  lastMessage?: {
    text: string;
    createdAt: string;
  };
  updatedAt: string;
};

// For a single chat message
export type IChatMessage = {
  _id: string;
  conversation: string;
  sender: Pick<IUser, '_id' | 'username' | 'profilePictureUrl'>;
  text: string;
  imageUrl?: string;
  readBy: string[];
  createdAt: string; // ISO String
  status?: 'sending' | 'sent' | 'failed';
};
export type INotification = {
    _id: string;
    recipient: string;
    sender?: Pick<IUser, '_id' | 'username' | 'profilePictureUrl'>;
    type: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
};

export type IAd = {
  _id: string;
  sponsorName: string;
  adTitle: string;
  adDescription: string;
  imageUrl: string;
  targetUrl: string;
};
