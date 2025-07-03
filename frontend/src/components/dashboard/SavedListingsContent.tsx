import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ListingCard from '@/components/listings/ListingCard';
import ListingCardSkeleton from '@/components/listings/ListingCardSkeleton';
import ListingDetailModal from '@/components/listings/ListingDetailModal';
import type { IListing } from '@/types';

// The backend must populate the 'savedListings' field for this to work.
interface PopulatedUser {
    savedListings: IListing[];
}

const SavedListingsContent: React.FC = () => {
    const navigate = useNavigate();
    const [savedListings, setSavedListings] = useState<IListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedListing, setSelectedListing] = useState<IListing | null>(null);

    useEffect(() => {
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
        fetchSavedListings();
    }, []);

    return (
        <div className="w-full h-full my-10 overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-semibold dark:text-white">Your Saved Listings</h3>
                <Button
                    className="bg-gradient-to-br from-blue-400 to-purple-400 dark:text-white"
                    onClick={() => navigate('/listings')}
                >
                    Browse More Passes
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <ListingCardSkeleton key={i} />
                    ))}
                </div>
            ) : savedListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedListings.map((listing) => (
                        <ListingCard key={listing._id} listing={listing} onClick={() => setSelectedListing(listing)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-neutral-700 dark:text-neutral-300">
                    <h4 className="text-md font-medium">You haven't saved any listings yet.</h4>
                    <p className="mt-1 text-sm">Click the heart icon on any listing to save it for later!</p>
                </div>
            )}

            <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
        </div>
    );
};

export default SavedListingsContent;
