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
  savedListings?: string[];
  latitude?: number;
  longitude?: number;
};

// Represents a listing, populated with seller info
export type IListing = {
  _id: string ;
  seller: IUser;
  cultPassType: string;
  description: string;
  category: string;
  askingPrice: number;
  originalPrice: number;
  displayLocation: string;
  city: string;
  latitude: number;
  longitude: number;
  isPromoted: boolean;
  isAvailable: boolean;
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
