// frontend/src/components/pages/landing/TrendingListings.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import ListingCard from '@/components/listings/ListingCard';
import ListingDetailModal from '@/components/listings/ListingDetailModal';
import { Button } from '@/components/ui/button';
import type { IListing } from '@/types';
import ListingCardSkeleton from './ListingCardSkeleton';


const TrendingListings: React.FC = () => {
  const [listings, setListings] = useState<IListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<IListing | null>(null);

  useEffect(() => {
    const fetchTrendingListings = async () => {
      setLoading(true);
      try {
        // Fetch 4 most recent, available listings
        const response = await api.get('/listings?limit=4&sortBy=createdAt_desc');
        // We'll combine promoted and regular for the homepage display
        const combinedListings = [
            ...response.data.promotedListings, 
            ...response.data.regularListings
        ];
        setListings(combinedListings.slice(0, 4)); // Ensure we only show a max of 4
      } catch (error) {
        console.error("Failed to fetch trending listings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrendingListings();
  }, []);

  return (
    <div className="bg-blue-300 py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold dark:text-white">Recent & Trending Passes</h2>
          <p className="text-neutral-800 dark:text-white mt-2">Freshly listed passes from our community.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {listings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                onClick={() => setSelectedListing(listing)}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
            <Link to="/listings">
                <Button size="lg" className = " text-neutral-900 dark:text-white" variant="outline">
                    View More Listings
                </Button>
            </Link>
        </div>
      </div>

      {/* The modal for viewing listing details */}
      <ListingDetailModal 
        listing={selectedListing} 
        onClose={() => setSelectedListing(null)} 
      />
    </div>
  );
};

export default TrendingListings;