export interface User {
  
    id?: string;
    username: string;
  email: string;
  password: string;
  city: string;
  phone: string;
  role: 'buyer' | 'seller';
  };


  export interface Listing {
    _id: string;
    seller: {
      _id: string;
      username: string;
      email: string;
      mobileNumber: string;
      role: string;
      profilePictureUrl: string;
    };
    cultPassType: string;
    expiryDate: string;
    askingPrice: number;
    originalPrice: number;
    availableCredits: number;
    city: string;
    latitude: number;
    longitude: number;
    adImageUrl: string;
    isAvailable: boolean;
    isPromoted: boolean;
    createdAt: string;
    updatedAt: string;
  }

export interface ListingsResponse {
    message: string;
    listings: Listing[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  }
  
export interface IListing {
  _id: string;
  cultPassType: string;
  description: string; // We added this
  category: string;     // We added this
  askingPrice: number;
  originalPrice: number;
  city: string;
  latitude: number;     // Now included
  longitude: number;    // Now included
  isPromoted: boolean;
  isAvailable: boolean;
  adImageUrl?: string;
  expiryDate: string;
  availableCredits?: number;
  views: number; // For the seller dashboard
  seller: {
    _id: string;
    username?: string;
    profilePictureUrl?: string;
    averageRating?: number;
    reviewCount?: number;
  };
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    username?: string;
    profilePictureUrl?: string;
  };
  text: string;
  createdAt: string;
}

export interface Participant {
  _id: string;
  username: string;
  profilePictureUrl?: string;
}
