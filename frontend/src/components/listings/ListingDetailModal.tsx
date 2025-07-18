// frontend/src/components/listings/ListingDetailModal.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';



// UI & Map Components
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Avatar } from 'antd';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import ReportModal from '../shared/ReportModal';

// Icons
import { UserOutlined } from '@ant-design/icons';
import { X, CalendarDays, MapPin, Star, Share2, Flag, Check, MessageCircle } from 'lucide-react';
import type { IListing } from '@passitpal/types';
import useAuthStore from '@/hooks/zustand/useAuthStore';


interface ListingDetailModalProps {
  listing: IListing | null;
  onClose: () => void;
  isDirectLink?: boolean;
}

const ListingDetailModal: React.FC<ListingDetailModalProps> = ({ listing, onClose, isDirectLink = false }) => {
  const { isAuthenticated, user, getOrCreateConversation } = useAuthStore();
  const navigate = useNavigate();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);


  // ---  Map setup logic  ---

  const mapContainerStyle = {
    width: '100%',
    height: '200px',
    borderRadius: '0.5rem',
  };

  const handleContactSeller = async () => {
    if (!isAuthenticated || !user) {
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
      navigate('/');
    } else {
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
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2"
        >
          <motion.div 
            key="modal-content" 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 50, opacity: 0 }} 
            transition={{ type: 'spring', stiffness: 300, damping: 25 }} 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="relative">
              <img 
                src={listing.adImageUrl || placeholderImage} 
                alt={listing.cultPassType} 
                onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage; }} 
                className="w-full h-40 object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button variant="link" size="icon" className="bg-black/30 hover:bg-black/50 rounded-full" onClick={handleShare}>
                  {isCopied ? <Check className="text-green-400" /> : <Share2 />}
                </Button>
                <Button variant="link" size="icon" className="bg-black/30 hover:bg-black/50 rounded-full" onClick={handleClose}>
                  <X />
                </Button>
              </div>
              {listing.isPromoted && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-400 px-2 py-0.5 text-xs font-bold text-neutral-900 rounded-full">
                  <Star className="h-3 w-3" fill="currentColor" /> Promoted
                </div>
              )}
            </div>
  
            <div className="p-4 space-y-3">
              {/* Compact Title & Location Row */}
              <div className="flex justify-between items-center">
                <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">{listing.cultPassType}</h2>
                <div className="flex items-center text-xs text-gray-600 gap-2">
                  <MapPin className="h-4 w-4" /> {listing.city}
                </div>
              </div>
  
              {/* Price Section */}
              <div className="flex justify-between items-center bg-gray-50 dark:bg-neutral-800 p-2 rounded-lg">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="line-through text-red-500">₹{listing.originalPrice.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-lg font-bold text-green-500">
                  ₹{listing.askingPrice.toLocaleString('en-IN')}
                </div>
              </div>
  
              {/* Expiry */}
              <div className="flex justify-between text-xs text-gray-600">
                <div className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Expires: {new Date(listing.expiryDate).toLocaleDateString()}</div>
                {listing.availableCredits && <div>Credits: <b>{listing.availableCredits}</b></div>}
              </div>
  
              {/* Description */}
              {listing.description && (
                <p className="text-sm text-gray-800 dark:text-gray-300 line-clamp-4">{listing.description}</p>
              )}
  
              {/* Map */}
              <div className="mt-2">
                {isAuthenticated ? (
                  listing.latitude && listing.longitude ? (
                    <GoogleMap 
                      mapContainerStyle={{ width: '100%', height: '150px', borderRadius: '0.5rem' }} 
                      center={{ lat: listing.latitude, lng: listing.longitude }} 
                      zoom={13}
                    >
                      <MarkerF position={{ lat: listing.latitude, lng: listing.longitude }} />
                    </GoogleMap>
                  ) : (
                    <div className="h-[150px] flex items-center justify-center bg-gray-200 rounded-md">Loading map...</div>
                  )
                ) : (
                  <div className="h-[150px] flex items-center justify-center bg-gray-200 rounded-md text-center text-gray-600 p-3">
                      Login to view maps
                  </div>
                )}
              </div>
  
              {/* Contact & Seller */}
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" size="sm" onClick={handleContactSeller}>
                <MessageCircle className="mr-2 h-4 w-4" /> Contact Seller
              </Button>
  
              <div className="flex justify-between items-center pt-3 border-t dark:border-neutral-700 mt-3">
                <Link to={`/profile/${listing.seller._id}`} className="flex items-center gap-2 group">
                  <Avatar size="small" src={listing.seller.profilePictureUrl} icon={<UserOutlined />} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary">{listing.seller.username}</span>
                </Link>
                {isAuthenticated && user?._id !== listing.seller._id && (
                  <Button variant="link" className="text-xs text-neutral-500 hover:text-red-500" onClick={() => setIsReportModalOpen(true)}>
                    <Flag className="mr-1 h-3 w-3" /> Report
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      {listing && (<ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} contentId={listing._id} contentType="Listing" contentTitle={listing.cultPassType} />)}
    </>
  );
};

export default ListingDetailModal;