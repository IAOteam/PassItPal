// frontend/src/components/dashboard/SavedListingsContent.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import ListingCard from '@/components/listings/ListingCard';
import ListingCardSkeleton from '@/components/listings/ListingCardSkeleton';
import { type Listing } from '@/components/listings/TrendingListings';
import ListingDetailModal from '@/components/listings/ListingDetailModal';

// The backend must populate the 'savedListings' field for this to work.
interface PopulatedUser {
    savedListings: Listing[];
}

const SavedListingsContent: React.FC = () => {
    const [savedListings, setSavedListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

    useEffect(() => {
        const fetchSavedListings = async () => {
            try {
                setLoading(true);
                // This endpoint needs to return the user with populated savedListings
                const response = await api.get('/users/me/profile/populated'); 
                setSavedListings(response.data.user.savedListings || []);
            } catch (error) {
                console.error("Failed to fetch saved listings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSavedListings();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Your Saved Items</h3>
            {savedListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedListings.map(listing => (
                        <ListingCard key={listing._id} listing={listing} onClick={() => setSelectedListing(listing)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <h4 className="text-lg font-medium">You haven't saved any listings yet.</h4>
                    <p className="text-gray-500 mt-1">Click the heart icon on any listing to save it for later!</p>
                </div>
            )}
             <ListingDetailModal 
                listing={selectedListing} 
                onClose={() => setSelectedListing(null)} 
            />
        </div>
    );
};

export default SavedListingsContent;