// src/components/dashboard/SavedListingsContent.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ListingCard from '@/components/listings/ListingCard';
import ListingCardSkeleton from '@/components/listings/ListingCardSkeleton';
import ListingDetailModal from '@/components/listings/ListingDetailModal';
import type { IListing } from '@/types';

const SavedListingsContent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // pulling user from auth to reflect optimistic saves
  const [savedListings, setSavedListings] = useState<IListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<IListing | null>(null);

  const fetchSavedListings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me/profile/populated');
      setSavedListings(response.data.user.savedListings || []);
    } catch (error) {
      console.error("Failed to fetch saved listings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedListings();
  }, []);

  // Optimistically update listings if user.savedListings changes
  useEffect(() => {
    if (!user?.savedListings) return;
    setSavedListings(prev =>
      prev.filter(listing => user?.savedListings?.includes(listing._id))
    );
  }, [user?.savedListings]);

  return (
    <div className="w-full h-full my-6 sm:my-10 overflow-y-auto px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8">
        <h3 className="text-lg sm:text-xl font-semibold dark:text-white text-center sm:text-left">
          Your Saved Listings
        </h3>
        <Button
          className="mt-4 sm:mt-0 w-full sm:w-auto bg-gradient-to-br from-blue-400 to-purple-400 dark:text-white"
          onClick={() => navigate('/listings')}
        >
          Browse More Passes
        </Button>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : savedListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedListings.map((listing) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              onClick={() => setSelectedListing(listing)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-neutral-700 dark:text-neutral-300">
          <h4 className="text-md font-medium">You haven't saved any listings yet.</h4>
          <p className="mt-1 text-sm">Click the heart icon on any listing to save it for later!</p>
        </div>
      )}

      {/* Modal */}
      <ListingDetailModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
      />
    </div>
  );
};

export default SavedListingsContent;
