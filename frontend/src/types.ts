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
  