// frontend/src/components/listings/ListingCard.tsx

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { type IListing } from '@/types';
import { getDistance } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from 'antd';

// Icons
import { UserOutlined } from '@ant-design/icons';
import { Star, Bookmark, CalendarDays, MapPin, NotebookText, MessageCircle } from 'lucide-react';


interface ListingCardProps {
  listing: IListing;
  onClick: () => void; //  will be used for the "View Details" button
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, getOrCreateConversation, saveListing, unsaveListing } = useAuth();
  const isSaved = user?.savedListings?.includes(listing._id);

  const placeholderImage = `https://placehold.co/600x400/171717/FFFFFF?text=${encodeURIComponent(listing.cultPassType)}`;
  const { isAuthenticated, user, getOrCreateConversation } = useAuth();
  const navigate = useNavigate();
  const handleContactSeller = async () => {
    if (!isAuthenticated || !user) {
      // If user is not logged in, redirect them to the login page
      // Pass the listing ID so we can potentially redirect them back after login
      navigate('/login', { state: { from: `/listings/${listing?._id}` } });
      return;
    }

    if (!listing || user._id === listing.seller._id) {
      // Prevent user from contacting themselves
      alert("You cannot contact yourself.");
      return;
    }

    try {
      const conversationId = await getOrCreateConversation(listing.seller._id);
      navigate(`/messages/${conversationId}`);
    } catch (err: any) {
      alert(err.message || "Could not start chat.");
    }
  };

  const handleContactSeller = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    if (!isAuthenticated || !user) {
      navigate('/login', { state: { from: `/listings/${listing?._id}` } });
      return;
    }
    if (!listing || user._id === listing.seller._id) {
      alert("You cannot contact yourself.");
      return;
    }
    try {
      const conversationId = await getOrCreateConversation(listing.seller._id);
      navigate(`/messages/${conversationId}`);
    } catch (err: any) {
      alert(err.message || "Could not start chat.");
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
        navigate('/login');
        return;
    }
    if (isSaved) {
      unsaveListing(listing._id);
    } else {
      saveListing(listing._id);
    }
  };

  return (
    <div
      onClick={onClick}

      className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg  bg-neutral-100 dark:bg-neutral-900 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col"

    >
      {/* --- Smart Save/Bookmark Button --- */}
      <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-black/30 text-white rounded-full hover:bg-black/50"
          onClick={handleSaveClick}
        >
          <Bookmark fill={isSaved ? 'white' : 'none'} />
        </Button>

      {/* Image Container */}
      <div className="relative overflow-hidden">
        <div
          className="h-48 w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url(${listing.adImageUrl || placeholderImage})` }}
        />
        
        {listing.isPromoted && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-blue-400 px-2 py-1 text-xs font-bold dark:text-white">
            <Star className="h-3 w-3" fill="currentColor" />
            <span>Promoted</span>
          </div>
        )}
      </div>

      {/* ---   UI layout   --- */}
      <div className="p-4 flex flex-col flex-grow">
        <div className='flex justify-between'>
          <div>
            <Badge variant="secondary" className="mb-2">
              {listing.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
            <h3 className="truncate text-xl font-bold dark:text-white" title={listing.cultPassType}>
              {listing.cultPassType}
            </h3>
            <div className='mt-2 flex items-center text-xs font-medium text-gray-500 gap-1'>
              <CalendarDays className="h-3 w-3" />
              <span>Expires: {new Date(listing.expiryDate).toLocaleDateString()}</span>
            </div>
          </div>
          <div className='mt-2 text-right'>
            <p className="line-through text-xs font-medium text-gray-500">
              ₹{listing.originalPrice.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-lg font-bold text-green-600">
              ₹{listing.askingPrice.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Seller Info & Location/Distance */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-neutral-800">
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
          <div className='flex items-center gap-1 text-xs font-medium text-gray-500'>
            <MapPin className="h-3 w-3" />
            <p>{listing.city}</p>
            {user?.latitude && user?.longitude && (
              <p className="font-semibold">
                • {getDistance(user.latitude, user.longitude, listing.latitude, listing.longitude).toFixed(1)} km
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-around mt-6">
          <Button className="w-auto flex-1 bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800/30 dark:text-blue-300 dark:hover:bg-blue-800/50" size="sm" onClick={onClick}>
            <NotebookText className="mr-2 h-4 w-4" /> View Details
          </Button>
          <Button className="w-auto flex-1 ml-2 bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800/30 dark:text-green-300 dark:hover:bg-green-800/50" size="sm" onClick={handleContactSeller}>
            <MessageCircle className="mr-2 h-4 w-4" /> Contact
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;