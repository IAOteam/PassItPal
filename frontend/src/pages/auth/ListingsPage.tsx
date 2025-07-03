// frontend/src/pages/ListingsPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import ListingCard from '@/components/listings/ListingCard'; 
import ListingDetailModal from '@/components/listings/ListingDetailModal'; 
import AdCard, { type IAd } from '@/components/listings/AdCard';
import { DualRangeSlider } from "@/components/ui/slider"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import usePlacesAutocomplete from 'use-places-autocomplete';
import ListingCardSkeleton from '@/components/listings/ListingCardSkeleton';
import { Pagination } from '@/components/ui/Pagination';
import { type IListing } from '@/types'
import { XCircle } from 'lucide-react';


type DisplayItem = (IListing & { type: 'listing' }) | (IAd & { type: 'ad' });
const ListingsPage: React.FC = () => {
  // const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State for listings
  const [promotedListings, setPromotedListings] = useState<IListing[]>([]);
  const [regularListings, setRegularListings] = useState<IListing[]>([]);
  const [ads, setAds] = useState<IAd[]>([]);
  // --- State for the modal ---
  const [selectedListing, setSelectedListing] = useState<IListing | null>(null);

  // State for UI and fetching
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ message: '', show: false });

  // State for filters and sorting
  const [locationTerm, setLocationTerm] = useState(searchParams.get('locationName') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt_desc');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || 50000,
  ]);


  // State for pagination
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(0);

  const location = useLocation();

  

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

  const handleLocationSelect = (description: string) => {
    setValue(description, false);
    setLocationTerm(description);
    clearSuggestions();
  };

  const fetchListings = useCallback((pageToFetch: number , isFallback = false) => {
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
    params.set('page', pageToFetch.toString());

    setSearchParams(params, { replace: true });

    api.get(`/listings?${params.toString()}`).then(response => {

        setPromotedListings(response.data.promotedListings || []);
        setRegularListings(response.data.regularListings || []);
        setAds(response.data.ads || []);
        setCurrentPage(response.data.currentPage || 1);
        setTotalPages(response.data.totalPages || 0);
        
        const { totalCount } = response.data;
        if (location.state?.fromHomepage && totalCount === 0) {
        alert(`No listings found for "${locationTerm}". Showing all available listings.`);
        // Reset the location filter and search params to show the default view
        setLocationTerm('');
        setSearchParams({}); // This will trigger a re-fetch via useEffect
        return; // Stop processing this response
    }

    }).catch(err => {
      setError(err.response?.data?.message || 'Failed to fetch listings.');
    }).finally(() => {
      setLoading(false);

    });
  }, [searchTerm, locationTerm, priceRange, sortBy, setSearchParams]);

  useEffect(() => {
    fetchListings(currentPage);
    window.scrollTo(0, 0);
  }, [currentPage]);

  // This effect runs ONLY ONCE on mount to fetch initial data based on URL.
  useEffect(() => {
    const initialPage = Number(searchParams.get('page')) || 1;
    setCurrentPage(initialPage);
    fetchListings(initialPage);
  }, []); // Empty dependency array ensures it runs only once

  const handleFilterApply = () => {
    if (currentPage === 1) {
      fetchListings(1); // Manually fetch if already on page 1
    } else {
      setCurrentPage(1); // Change page state, which triggers the useEffect above
    } // Fetch from page 1 when applying new filters
  };
  const handleClearFilters = () => {
    setSearchTerm('');
    setLocationTerm('');
    setValue(''); // Also clear autocomplete input
    setPriceRange([0, 50000]);
    setSortBy('createdAt_desc');
    setSearchParams({}); // Clear URL params
     if (currentPage === 1) {
        fetchListings(1);
    } else {
      setCurrentPage(1);
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
    <div className='mt-12 px-8 bg-neutral-200 dark:bg-neutral-800'>
      <div className="container md:p-6 lg:p-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl dark:text-white font-bold mb-2">Find Your Next Pass</h1>
          <p className="text-lg text-neutral-800 dark:text-neutral-400">
            {searchParams.get('locationName')
              ? `Showing listings for: ${searchParams.get('locationName')}`
              : "Browse all available passes from our community."
            }
          </p>
        </header>

        <div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filters and Sorting Bar */}
            <Input
              placeholder="Search by pass name..."
              className="w-full rounded-full text-black dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="relative">
              <Input
                placeholder="Search by location..."
                className='w-full rounded-full text-black dark:text-white'
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={!ready}
              />
              {suggestions.status === 'OK' && (
                <ul className="absolute z-10 w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.data.map(s => (
                    <li key={s.place_id} onClick={() => handleLocationSelect(s.description)} className="p-3 hover:bg-gray-200 dark:hover:bg-neutral-700 cursor-pointer text-black dark:text-white">
                      {s.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full rounded-full text-black dark:text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-neutral-800">
                <SelectItem value="createdAt_desc">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="expiry_desc">Longest Expiry</SelectItem>
                <SelectItem value="createdAt_asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 justify-around">
              <Button className='w-auto flex-1 rounded-full bg-blue-300 hover:bg-blue-400 dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-white' onClick={handleFilterApply}>Apply</Button>
              <Button className='w-auto flex-1 rounded-full bg-blue-300 hover:bg-blue-400 dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-white'  onClick={handleClearFilters}>Clear</Button>
            </div>
          </div>

          {/* <Button onClick={handleFilterApply} className="w-full md:w-auto">Apply</Button> */}
        </div>
        <div className="space-y-8 ">
          <DualRangeSlider
            value={priceRange}
            onValueChange={(newRange) => setPriceRange(newRange)}
            min={0}
            max={50000}
            step={1000}
          />
        </div>
      </div>

      {/* {loading && <p className="text-center py-10">Loading listings...</p>}
      {error && <p className="text-center py-10 text-red-500">{error}</p>}
       */}
      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : (
        <div className="mt-10 space-y-10">
          {/* Promoted Listings Section */}
          {promotedListings.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-10 border-b border-black dark:border-white text-black dark:text-white">Featured Passes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {promotedListings.map(listing => (
                  <ListingCard key={listing._id} listing={listing} onClick={() => setSelectedListing(listing)} />
                ))}
              </div>
            </section>
          )}

          {/* Regular Listings Section */}
          <section>
            {promotedListings.length > 0 && displayItems.length > 0 && <h2 className="text-2xl font-semibold mb-10 border-b border-black dark:border-white text-black dark:text-white">All Passes</h2>}
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
          <div className='pb-10'>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
          </div>

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
