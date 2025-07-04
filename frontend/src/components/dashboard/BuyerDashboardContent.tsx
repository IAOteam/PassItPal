// frontend/src/components/dashboard/BuyerDashboardContent.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';

interface MyOrder {
  _id: string;
  listing: {
    _id: string;
    cultPassType: string;
    adImageUrl?: string;
  };
  seller: {
    _id: string;
    username?: string;
  };
  offerPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt: string;
}

const BuyerDashboardContent: React.FC = () => {
  const navigate = useNavigate();
  const { cancelOrder, loading: authLoading, getOrCreateConversation } = useAuth();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/orders/me');
      setOrders(response.data.orders || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch your orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const handleContactSeller = async (sellerId: string) => {
    try {
      const conversationId = await getOrCreateConversation(sellerId);
      navigate(`/messages/${conversationId}`);
    } catch (err: any) {
      alert(err.message || 'Could not start chat.');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order request?')) return;
    try {
      const message = await cancelOrder(orderId);
      alert(message);
      fetchMyOrders();
    } catch (err: any) {
      alert(err.message || 'An error occurred while cancelling the order.');
    }
  };

  const getStatusBadgeVariant = (status: MyOrder['status']) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'accepted': return 'success';
      case 'completed': return 'default';
      case 'rejected':
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="my-6 px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h3 className="text-xl font-semibold dark:text-white">My Orders</h3>
        <Button
          className="w-full md:w-auto bg-gradient-to-br from-blue-400 to-purple-400"
          onClick={() => navigate('/listings')}
        >
          Browse More Passes
        </Button>
      </div>

      {loading && <p className="text-center text-gray-500">Loading your orders...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && (
        orders.length > 0 ? (
          <div className="border rounded-lg overflow-x-auto dark:text-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Your Offer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">{order.listing.cultPassType}</TableCell>
                    <TableCell>{order.seller.username || 'N/A'}</TableCell>
                    <TableCell>₹{order.offerPrice.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-y-1">
                      {order.status !== 'cancelled' && order.status !== 'rejected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContactSeller(order.seller._id)}
                          disabled={authLoading}
                          className="w-full mb-1"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contact Seller
                        </Button>
                      )}
                      {order.status === 'pending' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={authLoading}
                          className="w-full"
                        >
                          {authLoading ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 dark:text-white">
            <h4 className="text-md font-medium">You haven't placed any orders yet.</h4>
            <p className="mt-1 text-sm">Start by browsing passes available for sale!</p>
          </div>
        )
      )}
    </div>
  );
};

export default BuyerDashboardContent;
