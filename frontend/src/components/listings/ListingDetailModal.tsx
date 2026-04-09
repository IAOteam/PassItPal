// frontend/src/components/listings/ListingDetailModal.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

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

  const mapContainerStyle = {
    width: '100%',
    height: '220px',
    borderRadius: '0.5rem',
  } as const;

  const handleContactSeller = async () => {
    if (!isAuthenticated || !user) {
      navigate('/login', { state: { from: `/listings/${listing?._id}` } });
      return;
    }

    if (!listing || user._id === listing.seller._id) {
      alert('You cannot contact yourself.');
      return;
    }
    try {
      const conversationId = await getOrCreateConversation(listing.seller._id);
      navigate(`/messages/${conversationId}`);
    } catch (err: any) {
      alert(err.message || 'Could not start chat.');
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
    navigator.clipboard
      .writeText(listingUrl)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy link.');
      });
  };

  if (!listing) return null;

  const placeholderImage = `https://placehold.co/800x600/E7E7E7/6D6D6D?text=${encodeURIComponent(
    listing.cultPassType
  )}`;

  return (
    <>
      <Helmet>
        <title>{`${listing.cultPassType} in ${listing.city}`} | Passitpal</title>
        <meta
          name="description"
          content={`Find a great deal on ${listing.cultPassType} for just ₹${listing.askingPrice}. Originally priced at ₹${listing.originalPrice}. Buy or sell securely on Passitpal.`}
        />
      </Helmet>

      <AnimatePresence>
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-6"
        >
          <motion.div
            key="modal-content"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden"
          >
            {/* Rectangle body with equal columns on md+; fixed max height for symmetry */}
            <div className="grid grid-cols-1 md:grid-cols-2 md:h-[72vh] relative">
              <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant="link"
                      size="icon"
                      aria-label="Share listing"
                      className="bg-black/30 hover:bg-black/50 rounded-full"
                      onClick={handleShare}
                    >
                      {isCopied ? <Check className="text-green-400" /> : <Share2 />}
                    </Button>
                    <Button
                      variant="link"
                      size="icon"
                      aria-label="Close modal"
                      className="bg-black/30 hover:bg-black/50 rounded-full"
                      onClick={handleClose}
                    >
                      <X />
                    </Button>
                  </div>
              {/* LEFT: Image + details */}
              <div className="flex flex-col min-h-0">
                {/* Image */}
                <div className="relative">
                  <img
                    src={listing.adImageUrl || placeholderImage}
                    alt={listing.cultPassType}
                    onError={e => {
                      (e.target as HTMLImageElement).src = placeholderImage;
                    }}
                    className="w-full h-56   object-cover"
                  />
                  {/* Top-left badge */}
                  {listing.isPromoted && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-400 px-2 py-0.5 text-xs font-bold text-neutral-900 rounded-full">
                      <Star className="h-3 w-3" fill="currentColor" /> Promoted
                    </div>
                  )}
                  {/* Top-right actions */}
                  
                </div>

                {/* Details */}
                <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-4">
                  {/* Title & Location */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {listing.cultPassType}
                    </h2>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="h-4 w-4 mr-1" />
                      {listing.city}
                    </div>
                  </div>

                  {/* Price + Expiry/Credits */}
                  <div className="flex items-start justify-between gap-4 bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg">
                    <div>
                      <p className="line-through text-red-500 text-sm">
                        ₹{listing.originalPrice.toLocaleString('en-IN')}
                      </p>
                      <p className="text-lg font-bold text-green-500">
                        ₹{listing.askingPrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <CalendarDays className="h-4 w-4" />
                        Expires: {new Date(listing.expiryDate).toLocaleDateString()}
                      </div>
                      {listing.availableCredits ? (
                        <div>
                          Credits: <b>{listing.availableCredits}</b>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Description */}
                  {listing.description ? (
                    <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed">
                      {listing.description}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* RIGHT: Map + CTAs (stick to bottom) */}
              <div className="flex flex-col p-4 md:p-6 min-h-0">
                {/* Map */}
                <div className="rounded-lg overflow-hidden">
                  {isAuthenticated ? (
                    listing.latitude && listing.longitude ? (
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={{ lat: listing.latitude, lng: listing.longitude }}
                        zoom={13}
                      >
                        <MarkerF position={{ lat: listing.latitude, lng: listing.longitude }} />
                      </GoogleMap>
                    ) : (
                      <div className="h-[220px] flex items-center justify-center bg-gray-200 dark:bg-neutral-800 rounded-md text-gray-600 dark:text-gray-300">
                        Location loading…
                      </div>
                    )
                  ) : (
                    <div className="h-[220px] flex items-center justify-center bg-gray-200 dark:bg-neutral-800 rounded-md text-center text-gray-700 dark:text-gray-300 p-3">
                      Login to view map
                    </div>
                  )}
                </div>

                {/* CTAs & Seller info */}
                <div className="mt-auto pt-5 space-y-4">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                    onClick={handleContactSeller}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> Contact Seller
                  </Button>

                  <div className="flex items-center justify-between border-t pt-3 dark:border-neutral-700">
                    <Link to={`/profile/${listing.seller._id}`} className="flex items-center gap-2 group">
                      <Avatar size="small" src={listing.seller.profilePictureUrl} icon={<UserOutlined />} />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary">
                        {listing.seller.username}
                      </span>
                    </Link>

                    {isAuthenticated && user?._id !== listing.seller._id && (
                      <Button
                        variant="link"
                        className="text-xs text-neutral-500 hover:text-red-500"
                        onClick={() => setIsReportModalOpen(true)}
                      >
                        <Flag className="mr-1 h-3 w-3" /> Report
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
