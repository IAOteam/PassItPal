// frontend/src/components/listings/ListingDetailModal.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { IListing } from '@/types';

// UI & Map Components
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Avatar } from 'antd';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import ReportModal from '../shared/ReportModal';

// Icons
import { UserOutlined } from '@ant-design/icons';
import { X, CalendarDays, MapPin, Star, Share2, Flag, Check, MessageCircle } from 'lucide-react';


interface ListingDetailModalProps {
  listing: IListing | null;
  onClose: () => void;
  isDirectLink?: boolean;
}

const ListingDetailModal: React.FC<ListingDetailModalProps> = ({ listing, onClose, isDirectLink = false }) => {
  const { isAuthenticated, user, getOrCreateConversation } = useAuth();
  const navigate = useNavigate();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // ---  Map setup logic  ---
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY!
  });

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
    navigator.clipboard.writeText(listingUrl).then(() => {
      setIsCopied(true);
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
        <motion.div key="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div key="modal-content" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="relative">
              {listing.isPromoted && (<div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-neutral-900"><Star className="h-4 w-4" fill="currentColor" /><span>Promoted</span></div>)}
              <div className="absolute top-3 right-3 flex items-center gap-3 text-white">
                <Button variant="link" size="icon" className="rounded-full bg-black/20 hover:bg-black/40" onClick={handleShare}>{isCopied ? <Check className="text-green-400" /> : <Share2 />}<span className="sr-only">{isCopied ? 'Copied!' : 'Share'}</span></Button>
                <Button variant="link" size="icon" className="rounded-full bg-black/20 hover:bg-black/40" onClick={handleClose}><X /></Button>
              </div>
              <img src={listing.adImageUrl || placeholderImage} alt={listing.cultPassType} onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage; }} className="w-full h-56 object-cover" />
            </div>

            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{listing.cultPassType}</h2>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-500" /><span className="text-gray-700 dark:text-gray-300">{listing.city}</span></div>
                <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gray-500" /><span className="text-gray-700 dark:text-gray-300">Expires: {new Date(listing.expiryDate).toLocaleDateString()}</span></div>
              </div>
              {/* ---  Colored prices --- */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <div className="text-gray-700 dark:text-gray-300"><span className="text-xs">Original Price</span><p className="line-through text-red-500">₹{listing.originalPrice.toLocaleString('en-IN')}</p></div>
                <div className="text-right"><span className="text-xs font-semibold">Offered Price</span><p className="text-2xl font-bold text-green-500">₹{listing.askingPrice.toLocaleString('en-IN')}</p></div>
              </div>

              {/* Map view from --- */}
              {isLoaded && listing.latitude && listing.longitude ? (
                <div className="mt-4">
                  <GoogleMap mapContainerStyle={mapContainerStyle} center={{ lat: listing.latitude, lng: listing.longitude }} zoom={14}>
                    <MarkerF position={{ lat: listing.latitude, lng: listing.longitude }} />
                  </GoogleMap>
                </div>
              ) : <div>Loading map...</div>}

              {listing.availableCredits && (<p className="text-sm text-gray-600 dark:text-gray-400">Available Credits: <span className="font-semibold">{listing.availableCredits}</span></p>)}
              
              {/* ---Prominent contact button and new seller info layout --- */}
              <Button className="w-full text-base bg-blue-500 hover:bg-blue-600 text-white" size="lg" onClick={handleContactSeller}>
                <MessageCircle className="mr-2 h-5 w-5" /> Contact Seller
              </Button>

              <div className='flex justify-between items-center pt-4 border-t dark:border-neutral-700'>
                <Link to={`/profile/${listing.seller._id}`} className="flex items-center gap-3 group/seller rounded-lg hover:underline transition-colors">
                  <Avatar src={listing.seller.profilePictureUrl} icon={<UserOutlined />} />
                  <span className="font-medium text-sm text-gray-700 dark:text-gray-300 group-hover/seller:text-primary transition-colors">{listing.seller.username}</span>
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