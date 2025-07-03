import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

import ListingCard from '@/components/listings/ListingCard';
import ListingDetailModal from '@/components/listings/ListingDetailModal';
import AdCard, { type IAd } from '@/components/listings/AdCard';
import ListingCardSkeleton from '@/components/listings/ListingCardSkeleton';
import { DualRangeSlider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Pagination } from '@/components/ui/Pagination';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { type IListing } from '@/types';

type DisplayItem = IListing & { type: 'listing' } | IAd & { type: 'ad' };

const ListingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [promotedListings, setPromotedListings] = useState<IListing[]>([]);
  const [regularListings, setRegularListings] = useState<IListing[]>([]);
  const [ads, setAds] = useState<IAd[]>([]);
  const [selectedListing, setSelectedListing] = useState<IListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [locationTerm, setLocationTerm] = useState(searchParams.get('locationName') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt_desc');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || 50000
  ]);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(0);

  const fallbackToastShown = useRef(false);

  const {
    ready,
    value,
    suggestions,
    setValue,
    clearSuggestions,
    init
  } = usePlacesAutocomplete({ initOnMount: false, debounce: 300 });

  useEffect(() => {
    if ((window as any).google) init();
  }, [init]);

  const handleLocationSelect = (desc: string) => {
    setValue(desc, false);
    setLocationTerm(desc);
    clearSuggestions();
  };

  const fetchListings = useCallback(
    async (page: number, isFallback = false) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (!isFallback) {
          if (locationTerm) params.set('locationName', locationTerm);
          if (searchTerm) params.set('cultPassType', searchTerm);
          if (sortBy) params.set('sortBy', sortBy);
          if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
          if (priceRange[1] < 50000) params.set('maxPrice', priceRange[1].toString());
        }
        params.set('page', page.toString());
        setSearchParams(params, { replace: true });

        const res = await api.get(`/listings?${params.toString()}`);
        setPromotedListings(res.data.promotedListings || []);
        setRegularListings(res.data.regularListings || []);
        setAds(res.data.ads || []);
        setCurrentPage(res.data.currentPage);
        setTotalPages(res.data.totalPages);

        if (
          !isFallback &&
          location.state?.fromHomepage &&
          res.data.totalCount === 0 &&
          !fallbackToastShown.current
        ) {
          fallbackToastShown.current = true;
          toast(`No listings found for "${locationTerm}". Showing all listings.`);
          setLocationTerm('');
          setSearchParams({});
          fetchListings(1, true);
          return;
        }
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to fetch listings.');
      } finally {
        setLoading(false);
      }
    },
    [locationTerm, searchTerm, priceRange, sortBy, setSearchParams, location.state]
  );

  useEffect(() => {
    fetchListings(currentPage);
    window.scrollTo(0, 0);
  }, [currentPage, fetchListings]);

  const handleApply = () => {
    currentPage === 1 ? fetchListings(1) : setCurrentPage(1);
  };

  const handleClear = () => {
    setSearchTerm('');
    setLocationTerm('');
    setValue('');
    setPriceRange([0, 50000]);
    setSortBy('createdAt_desc');
    setSearchParams({});
    fetchListings(1);
  };

  const displayItems = useMemo<DisplayItem[]>(() => {
    const items: DisplayItem[] = [];
    let adIdx = 0;
    regularListings.forEach((l, idx) => {
      items.push({ ...l, type: 'listing' });
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
          {searchParams.get('locationName')
            ? `Showing for: ${searchParams.get('locationName')}`
            : 'Browse all available passes.'}
        </p>
      </header>

      {/* Filters */}
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
            <ul className="absolute z-10 w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
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
        <DualRangeSlider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={50000}
          step={500}
        />
      </div>

      {/* Listings */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-red-600 py-10">{error}</div>
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
                {promotedListings.length > 0 && (
                  <h2 className="text-2xl font-semibold mb-4 dark:text-white">All Passes</h2>
                )}
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
              onPageChange={setCurrentPage}
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
