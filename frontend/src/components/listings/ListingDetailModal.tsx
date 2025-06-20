// frontend/src/components/listings/ListingDetailModal.tsx (New File)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { X, CalendarDays, MapPin, MessageSquare, Star,Share2, Flag ,Check } from 'lucide-react';
import ReportModal from '../shared/ReportModal'; 

// Define the type for the listing prop, which is the full listing object
interface Listing {
  _id: string;
  cultPassType: string;
  askingPrice: number;
  originalPrice: number;
  city: string;
  isPromoted: boolean;
  adImageUrl?: string;
  expiryDate: string;
  availableCredits?: number;
  seller: {
    _id:string;
    username?: string;
    profilePictureUrl?: string;
  };
}

interface ListingDetailModalProps {
  listing: Listing | null;
  onClose: () => void;
   isDirectLink?: boolean;
}

const ListingDetailModal: React.FC<ListingDetailModalProps> = ({ listing, onClose,isDirectLink = false  }) => {
  const { isAuthenticated, user, getOrCreateConversation } = useAuth();
  const navigate = useNavigate();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
   const [isCopied, setIsCopied] = useState(false);
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
  const handleClose = () => {
    if (isDirectLink) {
      // If opened via direct link, go to homepage on close
      navigate('/');
    } else {
      // Otherwise, just call the normal close handler
      onClose();
    }
  };
  
const handleShare = () => {
    if (!listing) return;
    const listingUrl = `${window.location.origin}/listings?listingId=${listing._id}`;
    
    // Use the modern clipboard API
    navigator.clipboard.writeText(listingUrl).then(() => {
        setIsCopied(true);
        // Reset the "copied" state after 2 seconds
        setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy link.');
    });
  };
  if (!listing) return null;

  const placeholderImage = `https://placehold.co/600x400/E7E7E7/6D6D6D?text=${encodeURIComponent(listing.cultPassType)}`;

  return (
    <> 
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          key="modal-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          
          <div className="relative">
            {listing.isPromoted && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-neutral-900">
                <Star className="h-4 w-4" fill="currentColor" />
                <span>Promoted</span>
              </div>
            )}
            <img
              src={listing.adImageUrl || placeholderImage}
              alt={listing.cultPassType}
              onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage; }}
              className="w-full h-56 object-cover"
            />
          </div>

          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{listing.cultPassType}</h2>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">{listing.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Expires: {new Date(listing.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <div className="text-gray-700 dark:text-gray-300">
                    <span className="text-xs">Original Price</span>
                    <p className="line-through">₹
                        {/* <BadgeIndianRupee className="h-3 w-3" /> */}
                        {listing.originalPrice.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right text-primary dark:text-gray-200">
                    <span className="text-xs font-semibold">Offered Price</span>
                    <p className="text-2xl font-bold">₹
                        {/* <BadgeIndianRupee className="h-3 w-3" /> */}
                        {listing.askingPrice.toLocaleString('en-IN')}</p>
                </div>
            </div>

            {listing.availableCredits && (
                 <p className="text-sm text-gray-600 dark:text-gray-400">Available Credits: <span className="font-semibold">{listing.availableCredits}</span></p>
            )}

            <div className="pt-4 border-t dark:border-neutral-700">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">SELLER INFORMATION</p>
                  {/*  Seller Info is now a clickable link */}
                  <Link 
                    to={`/profile/${listing.seller._id}`} 
                    className="flex items-center gap-3 group/seller rounded-lg p-2 -ml-2 hover:bg-neutral-800/50 transition-colors"
                  >
                    <Avatar src={listing.seller.profilePictureUrl} icon={<UserOutlined />} size="large" />
                    <span className="font-medium text-gray-800 dark:text-gray-200 group-hover/seller:text-primary transition-colors">{listing.seller.username}</span>
                  </Link>
            </div>
            <div className="p-4 flex justify-between dark:text-gray-200 items-center  z-20">
            <Button className="w-auto  outline" size="lg" onClick={handleContactSeller}>
                <MessageSquare className="h-5 w-5 mr-2"/>
                Contact Seller
            </Button>
            
                {/* Share Button */}
                <Button variant="link" size="icon" className="rounded-full p-3 bg-black/20 hover:bg-black/40 text-white" onClick={handleShare}>
                  {isCopied ? <Check className="h-5 w-5 text-green-400" /> : <Share2 className="h-5 w-5" />}
                  <span className="sr-only">{isCopied ? 'Copied!' : 'Share'}</span>
                </Button>
                 {/* Close Button */}
                <Button variant="link" size="icon" className="rounded-full p-3 bg-black/20 hover:bg-black/40 text-white" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
            </div>
            {isAuthenticated && user?._id !== listing.seller._id && (
                    <div className="text-center mt-2">
                      <Button
                        variant="link"
                        className="text-xs text-neutral-500 hover:text-red-500"
                        onClick={() => setIsReportModalOpen(true)}
                      >
                        <Flag className="h-3 w-3 mr-1" />
                        Report this listing
                      </Button>
                    </div>
                  )}
          </div>

          {/* <Button variant="ghost" size="icon" className="absolute top-3 right-3 rounded-full bg-black/20 hover:bg-black/40 text-white" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button> */}
        </motion.div>
      </motion.div>
    </AnimatePresence>
    {listing && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          contentId={listing._id}
          contentType="Listing"
          contentTitle={listing.cultPassType}
           />
      )}
    </>
  );
};

export default ListingDetailModal;

