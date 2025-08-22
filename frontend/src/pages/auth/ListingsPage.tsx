import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData, type QueryFunctionContext } from '@tanstack/react-query';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
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
import { MapPin, Search } from 'lucide-react';

interface ListingsResponse {
  promotedListings: IListing[];
  regularListings: IListing[];
  ads: IAd[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

type ListingsQueryKey = readonly [string, Record<string, string | null>];

const fetchListings = async ({ queryKey }: QueryFunctionContext<ListingsQueryKey>): Promise<ListingsResponse> => {
    const [_key, filters] = queryKey;
    
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

const NoLocalListings: React.FC<{ location: string; onClear: () => void }> = ({ location, onClear }) => (
    <div className="text-center py-16 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
        <MapPin className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
            No listings found in "{location}" yet.
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Be the first to list an item in your area or browse all available passes.
        </p>
        <Button onClick={onClear} className="mt-6">
            <Search className="mr-2 h-4 w-4" /> Show All Listings
        </Button>
    </div>
);

const ListingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [selectedListing, setSelectedListing] = useState<IListing | null>(null);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('cultPassType') || '');
    const [locationTerm, setLocationTerm] = useState(searchParams.get('locationName') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt_desc');
    const [priceRange, setPriceRange] = useState<[number, number]>([
        Number(searchParams.get('minPrice')) || 0,
        Number(searchParams.get('maxPrice')) || 50000
    ]);
    const [directLinkListing, setDirectLinkListing] = useState<IListing | null>(null);
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [city, setCity] = useState(searchParams.get('city') || '');
    
    const { ready, value, suggestions, setValue, clearSuggestions } = usePlacesAutocomplete({ debounce: 300 });

    useEffect(() => {
        const locationParam = searchParams.get('locationName');
        if (locationParam) {
            setValue(locationParam, false);
        }
    }, []);

    const handleLocationSelect = (desc: string) => {
        setValue(desc, false);
        setLocationTerm(desc);
        clearSuggestions();
    };

    useEffect(() => {
        const listingIdFromUrl = searchParams.get('listingId');
        if (listingIdFromUrl) {
            api.get(`/listings/${listingIdFromUrl}`)
                .then(response => {
                    setDirectLinkListing(response.data);
                })
                .catch(error => {
                    console.error("Failed to fetch direct link listing:", error);
                    toast.error("Could not load the requested listing.");
                });
        }
    }, [searchParams]);

    const { data, isLoading, isError, error } = useQuery<ListingsResponse, Error, ListingsResponse, ListingsQueryKey>({
        queryKey: ['listings', { 
            locationName: searchParams.get('locationName'),
            cultPassType: searchParams.get('cultPassType'),
            sortBy: searchParams.get('sortBy'),
            minPrice: searchParams.get('minPrice'),
            maxPrice: searchParams.get('maxPrice'),
            page: searchParams.get('page') || '1',
            city: searchParams.get('city'),
            category: searchParams.get('category'),
        }],
        queryFn: fetchListings,
        placeholderData: keepPreviousData,
    });

    const handleApply = () => {
        const newParams = new URLSearchParams();
        if (searchTerm) newParams.set('cultPassType', searchTerm);
        if (locationTerm) newParams.set('locationName', locationTerm);
        if (city) newParams.set('city', city);
        if (category) newParams.set('category', category);
        if (sortBy) newParams.set('sortBy', sortBy);
        if (priceRange[0] > 0) newParams.set('minPrice', priceRange.toString());
        if (priceRange[1] < 50000) newParams.set('maxPrice', priceRange[1].toString());
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const handleClear = () => {
        setSearchTerm('');
        setLocationTerm('');
        setValue('', false);
        setPriceRange([0, 50000]);
        setSortBy('createdAt_desc');
        setCity('');
        setCategory('');
        setSearchParams({});
    };

    const handlePageChange = (page: number) => {
        setSearchParams(prev => {
            prev.set('page', page.toString());
            return prev;
        });
    };
    
    const { promotedListings = [], regularListings = [], ads = [], totalPages = 0, currentPage = 1 } = data || {};

    const displayItems = useMemo<DisplayItem[]>(() => {
        const items: DisplayItem[] = [];
        let adIdx = 0;
        regularListings.forEach((listing, idx) => {
            items.push({ ...listing, type: 'listing' });
            if ((idx + 1) % 5 === 0 && adIdx < ads.length) {
                items.push({ ...ads[adIdx], type: 'ad' });
                adIdx++;
            }
        });
        return items;
    }, [regularListings, ads]);

    const locationFilter = searchParams.get('locationName');
    const hasOtherFilters = searchParams.get('cultPassType') || searchParams.get('sortBy') !== 'createdAt_desc';
    const isInitialLocationSearchEmpty = !!locationFilter && !hasOtherFilters && !isLoading && regularListings.length === 0 && promotedListings.length === 0;

    return (
        <div className="min-h-screen">
            <Toaster position="top-center" />
    
            {/* Header */}
            <header className="text-center  px-4 md:px-8 lg:px-16 mt-10 py-7">
                <h1 className="text-2xl md:text-3xl font-bold dark:text-white ">Find Your Next Pass</h1>
                <p className="text-lg text-neutral-700 dark:text-neutral-300">
                    {searchParams.get('locationName') ? `Showing for: ${searchParams.get('locationName')}` : 'Browse all available passes.'}
                </p>
            </header>

            {/* Main Content Layout */}
            <div className="flex h-[calc(100vh-100px)]">
                {/* Filters Sidebar - Fixed, Non-scrolling */}
                <aside className="w-80 flex-shrink-0  px-6 ">
                    
                    <div className="">
                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-white">Pass Name</label>
                            <Input
                                placeholder="Pass name…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-white">Location</label>
                            <div className="relative">
                                <Input
                                    placeholder="Location…"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    disabled={!ready}
                                    className="w-full"
                                />
                                {suggestions.status === 'OK' && (
                                    <ul className="absolute z-10 w-full bg-white dark:bg-neutral-800 border rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                                        {suggestions.data.map(s => (
                                            <li key={s.place_id} onClick={() => handleLocationSelect(s.description)} className="p-3 hover:bg-gray-200 dark:hover:bg-neutral-700 cursor-pointer text-black dark:text-white">
                                                {s.description}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-white">City</label>
                            <Select value={city} onValueChange={setCity}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="City…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Bangalore">Bangalore</SelectItem>
                                    <SelectItem value="Mumbai">Mumbai</SelectItem>
                                    <SelectItem value="Delhi">Delhi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-white">Category</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Category…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Gym">Gym</SelectItem>
                                    <SelectItem value="Swimming">Swimming</SelectItem>
                                    <SelectItem value="Yoga">Yoga</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-white">Sort By</label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sort by…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="createdAt_desc">Newest First</SelectItem>
                                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                                    <SelectItem value="expiry_desc">Longest Expiry</SelectItem>
                                    <SelectItem value="createdAt_asc">Oldest First</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-white">Price Range</label>
                            <DualRangeSlider 
                                value={priceRange} 
                                onValueChange={setPriceRange} 
                                min={0} 
                                max={50000} 
                                step={500} 
                                className="mb-2"
                            />
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>₹{priceRange[0]}</span>
                                <span>₹{priceRange[1]}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button className="flex-1" onClick={handleApply}>Apply</Button>
                            <Button variant="outline" className="flex-1" onClick={handleClear}>Clear</Button>
                        </div>
                    </div>
                </aside>

                {/* Passes Section - Scrollable */}
                <main className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array(8).fill(0).map((_, i) => <ListingCardSkeleton key={i} />)}
                        </div>
                    ) : isError ? (
                        <div className="text-center text-red-600 py-10">{error.message}</div>
                    ) : (
                        <>
                            {isInitialLocationSearchEmpty ? (
                                <NoLocalListings location={locationFilter} onClear={handleClear} />
                            ) : (
                                <>
                                    {promotedListings.length > 0 && (
                                        <section className="mb-8">
                                            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Featured Passes</h2>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {promotedListings.map((l) => (
                                                    <ListingCard key={l._id} listing={l} onClick={() => setSelectedListing(l)} />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                    
                                    <section>
                                        {(displayItems.length > 0 || promotedListings.length > 0) && (
                                            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">All Passes</h2>
                                        )}
                                        {displayItems.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {displayItems.map((item) =>
                                                    item.type === 'listing' ? (
                                                        <ListingCard key={item._id} listing={item} onClick={() => setSelectedListing(item)} />
                                                    ) : (
                                                        <AdCard key={item._id} ad={item} />
                                                    )
                                                )}
                                            </div>
                                        ) : !isInitialLocationSearchEmpty && (
                                            <p className="text-center py-10 text-gray-500 dark:text-gray-400">No listings found matching your criteria.</p>
                                        )}
                                    </section>
                                </>
                            )}
                            
                            {totalPages > 1 && (
                                <div className="pt-8">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            <ListingDetailModal 
                listing={selectedListing || directLinkListing} 
                onClose={() => {
                    setSelectedListing(null);
                    setDirectLinkListing(null);
                    navigate('/listings', { replace: true });
                }} 
            />
        </div>
    );
};

export default ListingsPage;