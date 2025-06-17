// frontend/src/components/listings/ListingCard.tsx
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

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
}

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  const placeholderImage = `https://placehold.co/600x400/171717/FFFFFF?text=${encodeURIComponent(listing.cultPassType)}`;

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-lg shadow-md border border-neutral-800 bg-neutral-200 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <div
          className="h-48 w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url(${listing.adImageUrl || placeholderImage})` }}
        />
        {listing.isPromoted && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-1 text-xs font-bold text-neutral-900">
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
        <p className="text-sm text-neutral-900 mt-1">{listing.city}</p>
        
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
                <span className="text-xs text-neutral-400 group-hover/seller:text-white group-hover/seller:underline truncate transition-colors">
                    {listing.seller.username}
                </span>
            </Link>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;