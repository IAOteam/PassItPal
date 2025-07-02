// frontend/src/components/listings/ListingCard.tsx
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Star, MessageCircle, CalendarDays, MapPin, NotebookText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Update the Listing type to include seller details
interface Listing {
  _id: string;
  cultPassType: string;
  askingPrice: number;
  originalPrice: number;
  city: string;
  isPromoted: boolean;
  adImageUrl?: string;
  expiryDate: string;
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

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg  bg-neutral-100 dark:bg-neutral-900 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col"
    >
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

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className='flex justify-between'>
          <div>
            <h3 className="truncate text-xl font-bold dark:text-white" title={listing.cultPassType}>
              {listing.cultPassType}
            </h3>
            <div className=''>
              <div className="mt-2 flex items-center text-xs font-medium text-gray-500 gap-1">
                <CalendarDays className="h-3 w-3 " />
                <span>
                  Expires: {new Date(listing.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className='mt-2 place-items-center'>
            <p className="line-through text-xs font-medium text-gray-500">
              ₹{listing.originalPrice.toLocaleString('en-IN')}
            </p>
            <p className=" mt-1 text-lg font-bold text-green-600">
              ₹{listing.askingPrice.toLocaleString('en-IN')}
            </p>
          </div>
        </div>



        {/* Seller Info */}
        <div className="flex justify-between mt-4">
          <div>
            <Link
              to={`/profile/${listing.seller._id}`}
              onClick={(e) => e.stopPropagation()} // Prevents the main card's onClick from firing
              className="flex items-center gap-2 group/seller"
            >
              <Avatar src={listing.seller.profilePictureUrl} icon={<UserOutlined />} size="small" />
              <span className="text-xs font-medium text-gray-500 hover/seller:text-gray-700 dark:hover/seller:text-gray-300 hover/seller:underline truncate transition-colors">
                {listing.seller.username}
              </span>
            </Link>
          </div>
          <div className='flex items-center gap-1 text-xs font-medium text-gray-500'>
            <MapPin className="h-3 w-3" />
            <p>{listing.city}</p>
          </div>
        </div>
        <div className="flex justify-around mt-6">
          <Button className="w-auto bg-blue-300 hover:bg-blue-400 dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-white" size="sm" onClick={onClick}>
            <NotebookText />
            View Details
          </Button>
          <Button className="w-auto bg-blue-300 hover:bg-blue-400 dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-white" size="sm" onClick={handleContactSeller}>
            <MessageCircle />
            Contact Seller
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;