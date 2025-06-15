// frontend/src/components/listings/ListingCard.tsx (New File)
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Star } from 'lucide-react';

// Define the type for a single listing prop
interface Listing {
  _id: string;
  cultPassType: string;
  askingPrice: number;
  city: string;
  isPromoted: boolean;
  adImageUrl?: string;
}

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  const placeholderImage = `https://placehold.co/600x400/E7E7E7/6D6D6D?text=${encodeURIComponent(listing.cultPassType)}`;

  return (
    <div 
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-lg shadow-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all hover:shadow-xl hover:-translate-y-1"
    >
      {/* Promoted Badge */}
      {listing.isPromoted && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-1 text-xs font-bold text-neutral-900">
          <Star className="h-3 w-3" fill="currentColor" />
          <span>Promoted</span>
        </div>
      )}
      
      {/* Image Container */}
      <div className="overflow-hidden">
        <img
          src={listing.adImageUrl || placeholderImage}
          alt={listing.cultPassType}
          onError={(e) => { e.currentTarget.src = placeholderImage; }}
          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white" title={listing.cultPassType}>
          {listing.cultPassType}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{listing.city}</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xl font-bold text-primary">
            ₹{listing.askingPrice.toLocaleString('en-IN')}
          </p>
          <Badge variant="outline">View Details</Badge>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
