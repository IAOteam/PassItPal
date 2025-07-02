// frontend/src/components/admin/ManageListings.tsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import type { IListing } from '@/types';



const ManageListings: React.FC = () => {
  const [listings, setListings] = useState<IListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/listings');
      setListings(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch listings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleTogglePromote = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to toggle the promotion status for this listing?')) return;
    try {
      await api.put(`/admin/listings/${listingId}/promote`);
      alert('Listing promotion status updated.');
      fetchListings(); // Refresh the list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update promotion status.');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/listings/${listingId}`);
      alert('Listing deleted successfully by admin.');
      fetchListings(); // Refresh the list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete listing.');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Listings Management</h1>
      {loading && <p>Loading listings...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <div className="bg-black border border-neutral-800 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-black border-b border-neutral-800">
                <TableHead>Listing Name</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Promoted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing._id} className="border-b-0">
                  <TableCell>
                    <Link to={`/listings?listingId=${listing._id}`} target="_blank" className="hover:underline">
                      {listing.cultPassType}
                    </Link>
                  </TableCell>
                  <TableCell>{listing.seller?.username || 'N/A'}</TableCell>
                  <TableCell>₹{listing.askingPrice.toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    {listing.isAvailable ? (
                      <Badge variant="success" className="bg-green-500 text-white">Available</Badge>
                    ) : (
                      <Badge variant="secondary">Sold</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={listing.isPromoted ? 'default' : 'outline'}>
                      {listing.isPromoted ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleTogglePromote(listing._id)}>
                      {listing.isPromoted ? 'Un-promote' : 'Promote'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteListing(listing._id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ManageListings;