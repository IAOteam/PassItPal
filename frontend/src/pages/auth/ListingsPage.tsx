import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData, type QueryFunctionContext } from '@tanstack/react-query';
import api from '@/lib/api';
import { Toaster } from 'react-hot-toast';


import ListingCard from '@/components/listings/ListingCard';
import ListingDetailModal from '@/components/listings/ListingDetailModal';
import FilterSidebar from '@/components/listings/FilterSidebar'; 
import AdCard from '@/components/listings/AdCard';
import ListingCardSkeleton from '@/components/listings/ListingCardSkeleton';
import { DualRangeSlider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/Pagination';
import usePlacesAutocomplete from 'use-places-autocomplete';
import type { IListing, IAd } from '@passitpal/types';

interface ListingsResponse {
  promotedListings: IListing[];
  regularListings: IListing[];
  ads: IAd[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

// Define a precise type for our query key array.
type ListingsQueryKey = readonly [string, Record<string, string | null>];

// Define the data-fetching function with correct, explicit types.
const fetchListings = async ({ queryKey }: QueryFunctionContext<ListingsQueryKey>): Promise<ListingsResponse> => {
    const [_key, filters] = queryKey;
    
    // This ensures we only add non-empty filters to the URL, fixing the URLSearchParams argument error.
    const validFilters: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) {
        if (value) {
            validFilters[key] = value;
        }
    }

    const params = new URLSearchParams(validFilters);
    const { data } = await api.get(`/listings?${params.toString()}`);
    return data;
};

type DisplayItem = (IListing & { type: 'listing' }) | (IAd & { type: 'ad' });

const ListingsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // State is only for filter inputs, not for the data itself.
    const [selectedListing, setSelectedListing] = useState<IListing | null>(null);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('cultPassType') || '');
    const [locationTerm, setLocationTerm] = useState(searchParams.get('locationName') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt_desc');
    const [priceRange, setPriceRange] = useState<[number, number]>([
        Number(searchParams.get('minPrice')) || 0,
        Number(searchParams.get('maxPrice')) || 50000
    ]);
    
    const { ready, value, suggestions, setValue, clearSuggestions } = usePlacesAutocomplete({ debounce: 300 });

    const handleLocationSelect = (desc: string) => {
        setValue(desc, false);
        setLocationTerm(desc);
        clearSuggestions();
    };

    //  This is the fully-typed and corrected useQuery hook.
    const { data, isLoading, isError, error } = useQuery<ListingsResponse, Error, ListingsResponse, ListingsQueryKey>({
        queryKey: ['listings', { 
            locationName: searchParams.get('locationName'),
            cultPassType: searchParams.get('cultPassType'),
            sortBy: searchParams.get('sortBy'),
            minPrice: searchParams.get('minPrice'),
            maxPrice: searchParams.get('maxPrice'),
            page: searchParams.get('page') || '1'
        }],
        queryFn: fetchListings,
        placeholderData: keepPreviousData, // Correct property name for keeping data during loads.
    });

    // Filter handlers now simply update the URL. useQuery does the rest.
    const handleApply = () => {
        const newParams = new URLSearchParams();
        if (searchTerm) newParams.set('cultPassType', searchTerm);
        if (locationTerm) newParams.set('locationName', locationTerm);
        if (sortBy) newParams.set('sortBy', sortBy);
        if (priceRange[0] > 0) newParams.set('minPrice', priceRange[0].toString());
        if (priceRange[1] < 50000) newParams.set('maxPrice', priceRange[1].toString());
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const handleClear = () => {
        setSearchTerm('');
        setLocationTerm('');
        setValue('');
        setPriceRange([0, 50000]);
        setSortBy('createdAt_desc');
        setSearchParams({});
    };

    const handlePageChange = (page: number) => {
        setSearchParams(prev => {
            prev.set('page', page.toString());
            return prev;
        });
    };
    
    // Safely destructure data. The `|| {}` provides a safe fallback.
    const { promotedListings = [], regularListings = [], ads = [], totalPages = 0, currentPage = 1 } = data || {};

    const displayItems = useMemo<DisplayItem[]>(() => {
        const items: DisplayItem[] = [];
        let adIdx = 0;
        // The "spread" errors are gone because TypeScript now knows `regularListings` is an array of IListing objects.
        regularListings.forEach((listing, idx) => {
            items.push({ ...listing, type: 'listing' });
            if ((idx + 1) % 5 === 0 && adIdx < ads.length) {
                items.push({ ...ads[adIdx], type: 'ad' });
                adIdx++;
            }
        });
        return items;
    }, [regularListings, ads]);

    return (
        <div className="min-h-screen bg-neutral-200 dark:bg-neutral-800 py-8 px-4 md:px-8 lg:px-16 mt-10">
            <Toaster position="top-center" />
    
            <header className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold dark:text-white">Find Your Next Pass</h1>
                <p className="text-lg text-neutral-700 dark:text-neutral-300">
                    {searchParams.get('locationName') ? `Showing for: ${searchParams.get('locationName')}` : 'Browse all available passes.'}
                </p>
            </header>
    
            {/* Filters UI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Input
                    placeholder="Pass name…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-full dark:text-white"
                />
                <div className="relative">
                    <Input
                        placeholder="Location…"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        disabled={!ready}
                        className="rounded-full dark:text-white"
                    />
                    {suggestions.status === 'OK' && (
                        <ul className="absolute z-10 w-full bg-white dark:bg-neutral-800 border rounded-md mt-1 shadow-lg">
                            {suggestions.data.map(s => (
                                <li key={s.place_id} onClick={() => handleLocationSelect(s.description)} className="p-3 hover:bg-gray-200 dark:hover:bg-neutral-700 cursor-pointer text-black dark:text-white">
                                    {s.description}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="rounded-full dark:text-white">
                        <SelectValue placeholder="Sort by…" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-neutral-800 text-black dark:text-white">
                        <SelectItem value="createdAt_desc">Newest First</SelectItem>
                        <SelectItem value="price_asc">Price: Low to High</SelectItem>
                        <SelectItem value="price_desc">Price: High to Low</SelectItem>
                        <SelectItem value="expiry_desc">Longest Expiry</SelectItem>
                        <SelectItem value="createdAt_asc">Oldest First</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex gap-2">
                    <Button className="flex-1 rounded-full bg-blue-300 dark:bg-blue-600" onClick={handleApply}>Apply</Button>
                    <Button className="flex-1 rounded-full bg-blue-300 dark:bg-blue-600" onClick={handleClear}>Clear</Button>
                </div>
            </div>
            <div className="mb-6">
                <DualRangeSlider value={priceRange} onValueChange={setPriceRange} min={0} max={50000} step={500} />
            </div>
    
            {/* Listings Section */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array(8).fill(0).map((_, i) => <ListingCardSkeleton key={i} />)}
                </div>
            ) : isError ? (
                // FIX #7: Render the error.message property, which is a ReactNode.
                <div className="text-center text-red-600 py-10">{error.message}</div>
            ) : (
                <>
                    {promotedListings.length > 0 && (
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4 dark:text-white">Featured Passes</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {promotedListings.map((l) => (
                                    <ListingCard key={l._id} listing={l} onClick={() => setSelectedListing(l)} />
                                ))}
                            </div>
                        </section>
                    )}
                    <section>
                        {displayItems.length > 0 && (
                            <>
                                {promotedListings.length > 0 && <h2 className="text-2xl font-semibold mb-4 dark:text-white">All Passes</h2>}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {displayItems.map((item) =>
                                        item.type === 'listing' ? (
                                            <ListingCard key={item._id} listing={item} onClick={() => setSelectedListing(item)} />
                                        ) : (
                                            <AdCard key={item._id} ad={item} />
                                        )
                                    )}
                                </div>
                            </>
                        )}
                        {displayItems.length === 0 && promotedListings.length === 0 && (
                            <p className="text-center py-10 text-gray-500 dark:text-gray-300">No listings found matching your criteria.</p>
                        )}
                    </section>
                    <div className="pt-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </>
            )}
            <ListingDetailModal
                listing={selectedListing}
                onClose={() => setSelectedListing(null)}
            />
        </div>
    );
};

export default ListingsPage;
