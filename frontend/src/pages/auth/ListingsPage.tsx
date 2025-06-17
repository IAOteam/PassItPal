// frontend/src/pages/ListingsPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import ListingCard from '@/components/listings/ListingCard'; // Import the new card component
import ListingDetailModal from '@/components/listings/ListingDetailModal'; // Import the new modal component
import AdCard, { type IAd } from '@/components/listings/AdCard';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RangeSlider } from '@/components/ui/RangeSlider';
import usePlacesAutocomplete from 'use-places-autocomplete';

// Define a type for a single listing from the API
interface Listing {
  _id: string;
  cultPassType: string;
  askingPrice: number;
  originalPrice: number;
  city: string;
  isPromoted: boolean;
  adImageUrl?: string;
  expiryDate: string;
  availableCredits?: number;
  seller: {
    _id: string;
    username?: string;
    profilePictureUrl?: string;
  };
}

type DisplayItem = (Listing & { type: 'listing' }) | (IAd & { type: 'ad' });
const ListingsPage: React.FC = () => {
  // const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State for listings
  const [promotedListings, setPromotedListings] = useState<Listing[]>([]);
  const [regularListings, setRegularListings] = useState<Listing[]>([]);
  const [ads, setAds] = useState<IAd[]>([]); 
  // --- State for the modal ---
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  
  // State for UI and fetching
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters and sorting
  const [locationTerm, setLocationTerm] = useState(searchParams.get('locationName') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt_desc');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  // const [minPrice, setMinPrice] = useState('');
  // const [maxPrice, setMaxPrice] = useState('');
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const { ready, value, suggestions, setValue, clearSuggestions } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: 'in' } },
    debounce: 300,
  });

  const handleLocationSelect = (description: string) => {
    setValue(description, false);
    setLocationTerm(description);
    clearSuggestions();
  };
  const fetchListings = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (locationTerm) params.set('locationName', locationTerm);
      // if (searchParams.get('locationName')) params.append('locationName', searchParams.get('locationName')!);
      if (searchTerm) params.append('cultPassType', searchTerm);
      if (sortBy) params.append('sortBy', sortBy);
      // if (minPrice) params.append('minPrice', minPrice);
      // if (maxPrice) params.append('maxPrice', maxPrice);
      if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
      if (priceRange[1] < 50000) params.set('maxPrice', priceRange[1].toString());
      params.append('page', page.toString());
      params.append('limit', '12');
      setSearchParams(params);

      const response = await api.get(`/listings?${params.toString()}`);
      
      setPromotedListings(response.data.promotedListings || []);
      setRegularListings(response.data.regularListings || []);
      setAds(response.data.ads || []);
      setCurrentPage(response.data.currentPage || 1);
      setTotalPages(response.data.totalPages || 0);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch listings.');
    } finally {
      setLoading(false);
    }
  }, [searchParams,locationTerm, searchTerm, sortBy, priceRange]);
  const handleFilterApply = () => {
    fetchListings(1); // Fetch from page 1 when applying new filters
  };
  const handleClearFilters = () => {
    setSearchTerm('');
    setLocationTerm('');
    setValue(''); // Also clear autocomplete input
    setPriceRange([0, 50000]);
    setSortBy('createdAt_desc');
    setSearchParams({}); // Clear URL params
  };
  useEffect(() => {
    fetchListings(1);
  }, [fetchListings]);

  //useMemo hook to combine listings and ads into a single array for display
  const displayItems = useMemo(() => {
    const items: DisplayItem[] = regularListings.map(l => ({ ...l, type: 'listing' }));
    
    // Inject ads at specific positions
    if (ads.length > 0) {
      // Insert the first ad after the 4th listing (if enough listings exist)
      const firstAdIndex = 4;
      if (items.length >= firstAdIndex) {
        items.splice(firstAdIndex, 0, { ...ads[0], type: 'ad' });
      } else {
        items.push({ ...ads[0], type: 'ad' }); // else, add to end
      }
    }
    if (ads.length > 1) {
      // Insert the second ad after the 10th listing (index is now +1 due to first ad)
      const secondAdIndex = 11;
      if(items.length >= secondAdIndex) {
        items.splice(secondAdIndex, 0, { ...ads[1], type: 'ad' });
      }
    }
    return items;
  }, [regularListings, ads]);

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };


  const handlePageChange = (newPage: number) => {
    fetchListings(newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Find Your Next Pass</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {searchParams.get('locationName') 
            ? `Showing listings for: ${searchParams.get('locationName')}`
            : "Browse all available passes from our community."
          }
        </p>
      </header>

      {/* Filters and Sorting Bar */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg flex flex-col md:flex-row gap-4 items-center">
        <Input 
          placeholder="Search by pass name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <div className="relative">
            <Input 
              placeholder="Search by location..." 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!ready}
            />
             {suggestions.status === 'OK' && (
              <ul className="absolute z-10 w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
                {suggestions.data.map(s => (
                  <li key={s.place_id} onClick={() => handleLocationSelect(s.description)} className="p-3 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer text-black dark:text-white">
                    {s.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
        {/* <div className="flex gap-2 w-full md:w-auto">
          <Input type="number" placeholder="Min Price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <Input type="number" placeholder="Max Price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div> */}
        <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="createdAt_desc">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="expiry_desc">Longest Expiry</SelectItem>
                <SelectItem value="createdAt_asc">Oldest First</SelectItem>
            </SelectContent>
        </Select>
        {/* <Button onClick={handleFilterApply} className="w-full md:w-auto">Apply</Button> */}
      </div>
      <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-800">Price Range</label>
            <RangeSlider
                value={priceRange}
                onValueChange={(newRange) => setPriceRange(newRange as [number, number])}
                max={50000}
                step={1000}
            />
        </div>
        <div className="flex justify-end items-center gap-2 pt-2">
            <Button variant="ghost" onClick={handleClearFilters}>Clear Filters</Button>
            <Button onClick={handleFilterApply}>Apply</Button>
        </div>
      
      {loading && <p className="text-center py-10">Loading listings...</p>}
      {error && <p className="text-center py-10 text-red-500">{error}</p>}
      
      {!loading && !error && (
        <div className="space-y-10">
          {/* Promoted Listings Section */}
          {promotedListings.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Featured Passes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {promotedListings.map(listing => (
                  <ListingCard key={listing._id} listing={listing} onClick={() => setSelectedListing(listing)} />
                ))}
              </div>
            </section>
          )}

          {/* Regular Listings Section */}
          <section>
             {promotedListings.length > 0 && displayItems.length > 0 && <h2 className="text-2xl font-semibold mb-4 border-b pb-2">All Passes</h2>}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* {regularListings.map(listing => (
                <ListingCard key={listing._id} listing={listing} onClick={() => setSelectedListing(listing)} />
              ))} */}
               {displayItems.map(item => {
                if (item.type === 'listing') {
                  return <ListingCard key={item._id} listing={item} onClick={() => setSelectedListing(item)} />;
                }
                if (item.type === 'ad') {
                  return <AdCard key={item._id} ad={item} />;
                }
                return null;
              })}
            </div>
             {displayItems.length === 0 && promotedListings.length === 0 && (
                <p className="text-center py-10 text-gray-500">No listings found matching your criteria.</p>
             )}
          </section>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
                Previous
              </Button>
              <span>Page {currentPage} of {totalPages}</span>
              <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Render the modal conditionally */}
      <ListingDetailModal 
        listing={selectedListing} 
        onClose={() => setSelectedListing(null)} 
      />
    </div>
  );
};

export default ListingsPage;
