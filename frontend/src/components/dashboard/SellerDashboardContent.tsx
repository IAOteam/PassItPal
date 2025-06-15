// frontend/src/components/dashboard/SellerDashboardContent.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit, Trash2, Megaphone } from 'lucide-react';

interface ReceivedOrder {
  _id: string;
  listing: {
    _id: string;
    cultPassType: string;
  };
  buyer: {
    _id: string;
    username?: string;
  };
  offerPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt: string;
}

interface MyListing {
    _id: string;
    cultPassType: string;
    askingPrice: number;
    isAvailable: boolean;
    isPromoted: boolean;
    createdAt: string;
}

const SellerDashboardContent: React.FC = () => {
  const navigate = useNavigate();
  const { acceptOrder, rejectOrder, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState<ReceivedOrder[]>([]);
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersResponse, listingsResponse] = await Promise.all([
        api.get('/orders/seller'),
        api.get('/listings/my-listings')
      ]);
      setOrders(ordersResponse.data.orders || []);
      setListings(listingsResponse.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateOrderStatus = async (orderId: string, action: 'accept' | 'reject') => {
    const confirmationText = action === 'accept' 
      ? "Are you sure you want to accept this order? This will make the listing unavailable." 
      : "Are you sure you want to reject this order?";
      
    if (!window.confirm(confirmationText)) return;

    try {
      const message = action === 'accept' ? await acceptOrder(orderId) : await rejectOrder(orderId);
      alert(message);
      fetchData(); // Refresh all data on the dashboard
    } catch (err: any) {
      alert(err.message || `Failed to ${action} order.`);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this listing? This action cannot be undone.")) {
      return;
    }
    try {
        await api.delete(`/listings/${listingId}`);
        alert('Listing deleted successfully.');
        fetchData();
    } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete listing.');
    }
  };

  const handleEditListing = (listingId: string) => {
    alert(`Edit functionality for listing ${listingId} coming soon!`);
  };

  const handlePromoteListing = (listingId: string) => {
    alert(`Promotion feature for listing ${listingId} coming soon!`);
  }

  const getStatusBadgeVariant = (status: ReceivedOrder['status']) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'accepted': return 'success';
      case 'completed': return 'default';
      case 'rejected': case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-8">
      {/* Section for managing incoming orders */}
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Incoming Orders</h3>
        {loading && <p className="text-center text-gray-500">Loading orders...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && orders.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Offer Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">{order.listing.cultPassType}</TableCell>
                    <TableCell>{order.buyer.username || 'N/A'}</TableCell>
                    <TableCell>₹{order.offerPrice.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {order.status === 'pending' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleUpdateOrderStatus(order._id, 'accept')} disabled={authLoading}>
                            <Check className="h-4 w-4 mr-1" /> Accept
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleUpdateOrderStatus(order._id, 'reject')} disabled={authLoading}>
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : !loading && <p className="text-center text-gray-500 py-8">You have no incoming orders.</p>}
      </div>

      {/* Section for managing own listings */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">My Listings</h3>
            <Button onClick={() => navigate('/seller/create-listing')}>
                Create New Listing
            </Button>
        </div>
        {loading && <p className="text-center text-gray-500">Loading listings...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && listings.length > 0 ? (
           <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pass Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Promoted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing._id}>
                    <TableCell className="font-medium">{listing.cultPassType}</TableCell>
                    <TableCell>₹{listing.askingPrice.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      {listing.isAvailable ? (
                        <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Available</Badge>
                      ) : (
                        <Badge variant="secondary">Sold/Unavailable</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {listing.isPromoted ? (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">Yes</Badge>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                       {!listing.isPromoted && (
                         <Button variant="ghost" size="icon" onClick={() => handlePromoteListing(listing._id)} title="Promote Listing">
                           <Megaphone className="h-4 w-4 text-blue-500" />
                         </Button>
                       )}
                       <Button variant="ghost" size="icon" onClick={() => handleEditListing(listing._id)} title="Edit Listing">
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteListing(listing._id)} title="Delete Listing">
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : !loading && <p className="text-center text-gray-500 py-8">You have no listings.</p>}
      </div>
    </div>
  );
};

export default SellerDashboardContent;
