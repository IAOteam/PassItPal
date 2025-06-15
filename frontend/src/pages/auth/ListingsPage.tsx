// frontend/src/pages/ListingsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import ListingCard from '@/components/listings/ListingCard'; // Import the new card component
import ListingDetailModal from '@/components/listings/ListingDetailModal'; // Import the new modal component
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const ListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State for listings
  const [promotedListings, setPromotedListings] = useState<Listing[]>([]);
  const [regularListings, setRegularListings] = useState<Listing[]>([]);
  
  // --- State for the modal ---
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  
  // State for UI and fetching
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt_desc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchListings = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchParams.get('locationName')) params.append('locationName', searchParams.get('locationName')!);
      if (searchTerm) params.append('cultPassType', searchTerm);
      if (sortBy) params.append('sortBy', sortBy);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      params.append('page', page.toString());
      params.append('limit', '12');

      const response = await api.get(`/listings?${params.toString()}`);
      
      setPromotedListings(response.data.promotedListings || []);
      setRegularListings(response.data.regularListings || []);
      setCurrentPage(response.data.currentPage || 1);
      setTotalPages(response.data.totalPages || 0);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch listings.');
    } finally {
      setLoading(false);
    }
  }, [searchParams, searchTerm, sortBy, minPrice, maxPrice]);

  useEffect(() => {
    fetchListings(1);
  }, [fetchListings]);

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleFilterApply = () => {
    fetchListings(1);
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
        <div className="flex gap-2 w-full md:w-auto">
          <Input type="number" placeholder="Min Price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <Input type="number" placeholder="Max Price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
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
        <Button onClick={handleFilterApply} className="w-full md:w-auto">Apply</Button>
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
             {promotedListings.length > 0 && regularListings.length > 0 && <h2 className="text-2xl font-semibold mb-4 border-b pb-2">All Passes</h2>}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {regularListings.map(listing => (
                <ListingCard key={listing._id} listing={listing} onClick={() => setSelectedListing(listing)} />
              ))}
            </div>
             {regularListings.length === 0 && promotedListings.length === 0 && (
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
