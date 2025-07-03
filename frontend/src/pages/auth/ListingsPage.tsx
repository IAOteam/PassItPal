// frontend/src/pages/ListingsPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate , useLocation } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// Components
import ListingCard from '@/components/listings/ListingCard'; 
import ListingDetailModal from '@/components/listings/ListingDetailModal';
import AdCard, { type IAd } from '@/components/listings/AdCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DualRangeSlider } from "@/components/ui/slider"
import ListingCardSkeleton from '@/components/listings/ListingCardSkeleton';
import { Pagination } from '@/components/ui/Pagination';
import { XCircle } from 'lucide-react';
import usePlacesAutocomplete from 'use-places-autocomplete';

// Types
import { type IListing } from '@/types';
import { Label } from '@radix-ui/react-select';

// Define a type for a single listing from the API

type DisplayItem = (IListing & { type: 'listing' }) | (IAd & { type: 'ad' });
const ListingsPage: React.FC = () => {
  // const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const location = useLocation();

  // Data States
  const [promotedListings, setPromotedListings] = useState<IListing[]>([]);
  const [regularListings, setRegularListings] = useState<IListing[]>([]);
  const [ads, setAds] = useState<IAd[]>([]);
  const [selectedListing, setSelectedListing] = useState<IListing | null>(null);

  // State for UI and fetching
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ message: '', show: false });

  // State for filters and sorting
  const [locationTerm, setLocationTerm] = useState(searchParams.get('locationName') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt_desc');
  //const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [priceRange, setPriceRange] = useState<[number, number]>([
        Number(searchParams.get('minPrice')) || 0,
        Number(searchParams.get('maxPrice')) || 50000
    ]);
  // State for pagination
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(0);


  // Google Places Autocomplete Hook
  const { ready, value, suggestions, setValue, clearSuggestions  ,init} = usePlacesAutocomplete({
    initOnMount: false,
    // requestOptions: { componentRestrictions: { country: 'in' } },
    debounce: 300,
  });
  // Initialize the hook once the global Google script is ready
  useEffect(() => {
    if (window.google) {
      init();
    }
  }, [init]);
  
  const fetchListings = useCallback(async(page: number, isFallback = false) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    // Build query params from state
    if (!isFallback) {
        if (locationTerm) params.set('locationName', locationTerm);
        if (searchTerm) params.set('cultPassType', searchTerm);
        if (sortBy) params.set('sortBy', sortBy);
        if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
        if (priceRange[1] < 50000) params.set('maxPrice', priceRange[1].toString());
    }
    params.set('page', page.toString());
    

    setSearchParams(params, { replace: true });
    try {
            const response = await api.get(`/listings?${params.toString()}`);
            const { promotedListings, regularListings, ads, totalPages, currentPage, totalCount } = response.data;

            if (totalCount === 0 && !isFallback && (locationTerm || searchTerm)) {
                setToast({ message: `No listings found for your search. Showing all listings instead.`, show: true });
                handleResetToDefault(false); // Reset to default without fetching again here
                return;
            }

            setPromotedListings(promotedListings || []);
            setRegularListings(regularListings || []);
            setAds(ads || []);
            setTotalPages(totalPages || 0);
            setCurrentPage(currentPage || 1);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch listings.');
        } finally {
            setLoading(false);
        }
      }, [locationTerm, searchTerm, sortBy, priceRange]);

      useEffect(() => {
        fetchListings(currentPage);
        window.scrollTo(0, 0);
      }, [currentPage]);

      // Effect to handle direct URL loads with params
  useEffect(() => {
    // This runs once on mount to sync state with URL
    const locationParam = searchParams.get('locationName');
    if (locationParam) {
      setLocationTerm(locationParam);
      setValue(locationParam);
    }
    // Then fetches the data
    fetchListings(currentPage);
  }, [fetchListings]); // This effect will run when fetchListings function is stable

  // Toast auto-hide effect
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ message: '', show: false }), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLocationSelect = (description: string) => {
    setValue(description, false);
    setLocationTerm(description);
    clearSuggestions();
  };

  // This effect runs ONLY ONCE on mount to fetch initial data based on URL.
  useEffect(() => {
    const initialPage = Number(searchParams.get('page')) || 1;
    setCurrentPage(initialPage);
    fetchListings(initialPage);
  }, []); // Empty dependency array ensures it runs only once

  const handleFilterApply = () => {
    const params = new URLSearchParams();
    if (locationTerm) params.set('locationName', locationTerm);
    if (searchTerm) params.set('cultPassType', searchTerm);
    if (sortBy) params.set('sortBy', sortBy);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 50000) params.set('maxPrice', priceRange[1].toString());
    setSearchParams(params);
    
    if (currentPage === 1) fetchListings(1);
    else setCurrentPage(1);
  };

  const handleResetToDefault = (doFetch = true) => {
    setSearchTerm('');
    setLocationTerm('');
    setValue('');
    setPriceRange([0, 50000]);
    setSortBy('createdAt_desc');
    setSearchParams({});
    if (doFetch) {
        if (currentPage === 1) fetchListings(1, true);
        else setCurrentPage(1);
    }
  };

  //useMemo hook to combine listings and ads into a single array for display
  const displayItems = useMemo(() => {
    const items: DisplayItem[] = [];
    let adIndex = 0;

    regularListings.forEach((listing, index) => {
      // Add the listing to our display array
      items.push({ ...listing, type: 'listing' as const });

      // After every 5th listing, try to inject an ad
      if ((index + 1) % 5 === 0) {
        if (adIndex < ads.length) {
          items.push({ ...ads[adIndex], type: 'ad' as const });
          adIndex++; // Move to the next available ad
        }
      }
    });
    return items;
  }, [regularListings, ads]);


  const handleSortChange = (value: string) => {
    setSortBy(value);
  };


  // const handlePageChange = (newPage: number) => {
  //   fetchListings(newPage);
  //   window.scrollTo(0, 0);
  // };

  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );



return (
    <div className='bg-neutral-100 dark:bg-black min-h-screen'>
        {toast.show && (
            <div className="fixed top-24 right-5 z-50 bg-red-600 text-white p-4 rounded-lg shadow-lg flex items-center animate-pulse">
                <XCircle className="mr-2" /> {toast.message}
            </div>
        )}
        <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-24">
            <header className="mb-8 text-center">
                <h1 className="text-4xl dark:text-white font-bold mb-2">Find Your Next Pass</h1>
                <p className="text-lg text-neutral-700 dark:text-neutral-400">Browse all available passes from our community.</p>
            </header>

            <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg shadow-lg mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input placeholder="Search by pass name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <div className="relative">
                        <Input placeholder="Search by location..." value={value} onChange={(e) => setValue(e.target.value)} disabled={!ready} />
                        {/* Autocomplete suggestions list */}
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="createdAt_desc">Newest First</SelectItem>
                            <SelectItem value="price_asc">Price: Low to High</SelectItem>
                            <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            <SelectItem value="expiry_desc">Longest Expiry</SelectItem>
                            <SelectItem value="createdAt_asc">Oldest First</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2 justify-around">
                        <Button className='w-auto flex-1' onClick={handleFilterApply}>Apply</Button>
                        <Button className='w-auto flex-1' variant="ghost" onClick={() => handleResetToDefault()}>Reset</Button>
                    </div>
                </div>
                <div>
                    <Label>Price Range: ₹{priceRange[0]} - ₹{priceRange[1] === 50000 ? '50,000+' : `₹${priceRange[1]}`}</Label>
                    <DualRangeSlider value={priceRange} onValueChange={setPriceRange} max={50000} step={1000} />
                </div>
            </div>

            {loading ? <SkeletonGrid /> : error ? <div className="text-center py-10 text-red-500">{error}</div> : (
                <div className="space-y-10">
                    {promotedListings.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-semibold mb-4 pb-2 border-b dark:border-neutral-700 text-black dark:text-white">Featured Passes</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {promotedListings.map(listing => <ListingCard key={listing._id} listing={listing} onClick={() => setSelectedListing(listing)} />)}
                            </div>
                        </section>
                    )}
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 pb-2 border-b dark:border-neutral-700 text-black dark:text-white">All Passes</h2>
                        {displayItems.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {displayItems.map(item => item.type === 'listing' ? 
                                    <ListingCard key={item._id} listing={item} onClick={() => setSelectedListing(item)} /> :
                                    <AdCard key={item._id} ad={item} />
                                )}
                            </div>
                        ) : (
                            <p className="text-center py-10 text-gray-500">No listings found matching your criteria.</p>
                        )}
                    </section>
                    <div className='pb-10'>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                </div>
            )}
            <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
        </div>
    </div>
  );
};

export default ListingsPage;

