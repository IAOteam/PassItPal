import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [loading, setLoading] = useState(true);
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
      alert(err.message || "Could not start chat.");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order request?")) return;
    try {
      const message = await cancelOrder(orderId);
      alert(message);
      fetchMyOrders();
    } catch (err: any) {
      alert(err.message || "An error occurred while cancelling the order.");
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
  const handleConfirmReceipt = async (orderId: string) => {
    if (!window.confirm("Please confirm only if you have received and verified the pass/ticket. This action is final and will complete the transaction.")) {
        return;
    }
    try {
        const response = await api.post(`/orders/${orderId}/complete`);
        alert(response.data.message);
        fetchMyOrders(); // Refresh the order list
    } catch (err: any) {
        alert(err.response?.data?.message || "Failed to confirm the order.");
    }
};

  return (
    <TooltipProvider>
      <section className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">My Orders</h2>
          <Button
            className="bg-gradient-to-br from-blue-500 to-purple-500 text-white hover:opacity-90 transition"
            onClick={() => navigate('/listings')}
          >
            Browse More Passes
          </Button>
        </div>

        {loading && (
          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">Loading your orders...</div>
        )}

        {error && (
          <div className="text-center text-red-500 font-medium">{error}</div>
        )}

        {!loading && !error && (
          orders.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <Table className="min-w-full text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Listing</TableHead>
                    <TableHead className="text-left">Seller</TableHead>
                    <TableHead className="text-left">Your Offer</TableHead>
                    <TableHead className="text-left">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order._id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
                    >
                      <TableCell className="font-medium text-neutral-900 dark:text-white truncate max-w-[160px]">
                        {order.listing.cultPassType}
                      </TableCell>
                      <TableCell className="text-neutral-700 dark:text-neutral-300 truncate max-w-[120px]">
                        {order.seller.username || 'N/A'}
                      </TableCell>
                      <TableCell className="text-neutral-800 dark:text-neutral-200">
                        ₹{order.offerPrice.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                          {order.status}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-right space-x-2">
                        {(order.status !== 'cancelled' && order.status !== 'rejected') && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleContactSeller(order.seller._id)}
                                disabled={authLoading}
                                className="rounded-full"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Contact Seller</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {order.status === 'pending' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleCancelOrder(order._id)}
                                disabled={authLoading}
                                className="rounded-full"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cancel Order</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {order.status === 'accepted' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleConfirmReceipt(order._id)}>
                                Confirm Receipt & Complete Deal
                            </Button>
                        )}

                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <h4 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                No orders placed yet.
              </h4>
              <p className="text-sm text-neutral-500 mt-1">
                Start exploring passes and make your first offer!
              </p>
            </div>
          )
        )}
      </section>
    </TooltipProvider>
  );
};

export default BuyerDashboardContent;
