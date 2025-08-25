// src/components/listings/ListingCard.tsx
import { useNavigate } from 'react-router-dom';


import { getDistance } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from 'antd';

// Icons
import { UserOutlined } from '@ant-design/icons';
import { Star, Bookmark, CalendarDays, MapPin, NotebookText, MessageCircle } from 'lucide-react';

import useAuthStore from '@/hooks/zustand/useAuthStore';
import type { IListing } from '@passitpal/types';

interface ListingCardProps {
  listing: IListing;
  onClick: () => void;
}

// Helper function to safely extract the category name.
// Moved outside the component to prevent re-declaration on every render.
const getCategoryName = (listing: IListing): string => {
  if (!listing.categories || listing.categories.length === 0) {
    return 'General';
  }
  const firstCategory = listing.categories[0];
  // Check if the category is populated (i.e., it's an object with a 'name' property)
  if (typeof firstCategory === 'object' && firstCategory !== null && 'name' in firstCategory) {
    return firstCategory.name;
  }
  // Fallback for an unpopulated category ID or other unexpected shapes.
  return 'Category';
};

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    getOrCreateConversation,
    saveListing,
    unsaveListing,
  } = useAuthStore();

  const isSaved = user?.savedListings?.some(item => (typeof item === 'string' ? item : item._id) === listing._id);
  const placeholderImage = `https://placehold.co/600x400/171717/FFFFFF.png?text=${encodeURIComponent(listing.cultPassType)}&font=lato`;

  const handleContactSeller = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return navigate('/login', { state: { from: `/listings/${listing._id}` } });
    if (user?._id === listing.seller._id) return alert("You cannot contact yourself.");

    try {
      const conversationId = await getOrCreateConversation(listing.seller._id);
      navigate(`/messages/${conversationId}`);
    } catch (err: any) {
      alert(err.message || "Could not start chat.");
    }
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return navigate('/login');

    try {
      if (isSaved) {
        await unsaveListing(listing._id);
      } else {
        await saveListing(listing._id);
      }
    } catch (err: any) {
      console.error("Save error:", err.message);
    }
  };

  const displayCategory = getCategoryName(listing);

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg bg-neutral-100 dark:bg-neutral-900 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col w-72"
    >
      {/* Save Button */}
      <Button
        size="icon"
        className="absolute top-2 right-2 z-10 bg-black/30 text-white rounded-full hover:bg-black/50"
        onClick={handleSaveClick}
        aria-label={isSaved ? 'Unsave Listing' : 'Save Listing'}
      >
        <Bookmark fill={isSaved ? 'white' : 'none'} />
      </Button>

      {/* Image */}
      <div className="relative overflow-hidden">
        <div
          className="h-48 w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url(${listing.adImageUrl || placeholderImage})` }}
        />
        {listing.isPromoted && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-blue-400 px-2 py-1 text-xs font-bold text-neutral-900">
            <Star className="h-3 w-3" fill="currentColor" />
            <span>Promoted</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex flex-col justify-between items-start">
          <div className="flex-1">
            <Badge variant="secondary" className="text-neutral-700 dark:text-neutral-300">
              {displayCategory}
            </Badge>
            <h3 className="truncate text-xl font-bold dark:text-white mt-1">
              {listing.cultPassType.slice(0, 20)+(listing.cultPassType.length > 20 ? '...' : '')}
            </h3>
            <div className="mt-2 flex items-center text-xs font-medium text-gray-500 gap-1">
              <CalendarDays className="h-3 w-3" />
              <span>Expires: {new Date(listing.expiryDate).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-right flex items-baseline gap-2">
            <p className="text-lg font-bold text-green-600 mt-1">
              ₹{listing.askingPrice.toLocaleString('en-IN')}
            </p>
            <p className="line-through text-xs font-medium text-gray-500">
              ₹{listing.originalPrice.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Seller Info & Distance */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-neutral-700">
          <a
            href={`/profile/${listing.seller._id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 group/seller hover:underline"
          >
            <Avatar src={listing.seller.profilePictureUrl} icon={<UserOutlined />} size="small" />
            <span className="text-xs font-medium text-gray-500 group-hover/seller:text-gray-700 dark:group-hover/seller:text-gray-300 truncate transition-colors">
              {listing.seller.username}
            </span>
          </a>
          <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
            <MapPin className="h-3 w-3" />
            <p>{listing.displayLocation}</p>

            {user?.latitude && user?.longitude && (
              <p className="font-semibold">
                • {getDistance(user.latitude, user.longitude, listing.latitude, listing.longitude).toFixed(1)} km
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-around gap-2 mt-6">
          <Button
            className="flex-1 bg-blue-200 text-blue-800 hover:bg-blue-300 dark:bg-blue-800/30 dark:text-blue-300 dark:hover:bg-blue-800/50"
            size="sm"
            onClick={onClick}
          >
            <NotebookText className="mr-2 h-4 w-4" /> View Details
          </Button>
          <Button
            className="flex-1 bg-green-200 text-green-800 hover:bg-green-300 dark:bg-green-800/30 dark:text-green-300 dark:hover:bg-green-800/50"
            size="sm"
            onClick={handleContactSeller}
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Contact
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
