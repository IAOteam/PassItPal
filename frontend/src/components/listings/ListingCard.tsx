// frontend/src/components/listings/ListingCard.tsx
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Bookmark, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { getDistance } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth'; // We'll need the user's location


// Update the Listing type to include seller details
interface Listing {
  _id: string;
  cultPassType: string;
  askingPrice: number;
  city: string;
  isPromoted: boolean;
  adImageUrl?: string;
  seller: {
    _id: string;
    username?: string;
    profilePictureUrl?: string;
  };
  category : string;
  latitude: number ; 
  longitude: number;
}

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  const placeholderImage = `https://placehold.co/600x400/171717/FFFFFF?text=${encodeURIComponent(listing.cultPassType)}`;

  const { user , saveListing, unsaveListing } = useAuth();
  const isSaved = user?.savedListings?.includes(listing._id);

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-lg shadow-md border border-neutral-800 bg-neutral-200 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col"
    >
      <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-black/30 text-white rounded-full hover:bg-black/50"
          onClick={(e) => {
            e.stopPropagation(); // Prevents the modal from opening
            // We will wire this up in the next task
            console.log('Save button clicked for listing:', listing._id);
          }}
        >
          {/* We will add logic to change this icon later */}
          <Bookmark />
      </Button>
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <div
          className="h-48 w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url(${listing.adImageUrl || placeholderImage})` }}
        />
        <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-black/30 text-white rounded-full hover:bg-black/50"
            onClick={(e) => {
              e.stopPropagation();
              if (isSaved) {
                unsaveListing(listing._id);
              } else {
                saveListing(listing._id);
              }
            }}
          >
            <Bookmark fill={isSaved ? 'white' : 'none'} />
        </Button>
        {listing.isPromoted && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-blue-400 px-2 py-1 text-xs font-bold text-neutral-900">
            <Star className="h-3 w-3" fill="currentColor" />
            <span>Promoted</span>
          </div>
        )}
        
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="truncate text-lg font-semibold text-neutral-900" title={listing.cultPassType}>
          {listing.cultPassType}
        </h3>

        <div className="mt-2">
          <Badge variant="secondary">
            {listing.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>
        {/* <p className="text-sm text-neutral-900 mt-1">{listing.city}</p> */}
        <p className="text-sm text-neutral-900 mt-1">
            {listing.city}
            {user?.latitude && user?.longitude && (
              <span className="ml-2 font-semibold">
                • {getDistance(user.latitude, user.longitude, listing.latitude, listing.longitude).toFixed(1)} km away
              </span>
            )}zds
          </p>
        
        <div className="mt-4 flex-grow flex items-end justify-between">
            <p className="text-xl font-bold text-primary">
                ₹{listing.askingPrice.toLocaleString('en-IN')}
            </p>
        </div>

        {/* Seller Info */}
        <div className="mt-4 pt-3 border-t border-neutral-800">
            <Link 
                to={`/profile/${listing.seller._id}`} 
                onClick={(e) => e.stopPropagation()} // Prevents the main card's onClick from firing
                className="flex items-center gap-2 group/seller"
            >
                <Avatar src={listing.seller.profilePictureUrl} icon={<UserOutlined />} size="small" />
                <span className="text-xs text-neutral-800 group-hover/seller:text-white group-hover/seller:underline truncate transition-colors">
                    {listing.seller.username}
                </span>
            </Link>
        </div>
        
      </div>
    </div>
  );
};

export default ListingCard;