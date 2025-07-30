import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ListingCard from '@/components/listings/ListingCard';
import ListingCardSkeleton from '@/components/listings/ListingCardSkeleton';
import ListingDetailModal from '@/components/listings/ListingDetailModal';
import type { IListing, IUser } from '@passitpal/types';
import { AlertTriangle, BookmarkX } from 'lucide-react';

// --- API Fetching Function for TanStack Query ---
// This function fetches the user's profile and specifically returns the populated savedListings array.
function isListingPopulated(listing: string | Partial<IListing>): listing is IListing {
  return typeof listing === 'object' && listing !== null && '_id' in listing;
}

const fetchPopulatedProfile = async (): Promise<{ user: IUser }> => {
  const { data } = await api.get('/users/me/profile/populated');
  return data;
};

// const fetchSavedListings = async (): Promise<IListing[]> => {
//     const response = await api.get('/users/me/profile/populated'); 
//     return response.data.user.savedListings || [];
// };

const SavedListingsContent: React.FC = () => {
    const navigate = useNavigate();
    const [selectedListing, setSelectedListing] = useState<IListing | null>(null);

    // --- TanStack Query to fetch and manage saved listings data ---
    const { data, isLoading, isError, error } = useQuery<{ user: IUser }, Error>({
        queryKey: ['populatedUserProfile'],
        queryFn: fetchPopulatedProfile,
    });

    const savedListings = data?.user?.savedListings?.filter(isListingPopulated) || [];


    if (isLoading) {
        return (
            <div className="w-full h-full my-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => <ListingCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-12 text-red-500">
                <h4 className="text-md font-medium">Error</h4>
                <p className="mt-1 text-sm">{error.message}</p>
            </div>
        );
    }

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
            {savedListings && savedListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedListings.map(listing => (
                        <ListingCard key={listing._id} listing={listing} onClick={() => setSelectedListing(listing)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-neutral-700 dark:text-neutral-300">
                    <h4 className="text-md font-medium">You haven't saved any listings yet.</h4>
                    <p className="mt-1 text-sm">Click the bookmark icon on any listing to save it for later!</p>
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
