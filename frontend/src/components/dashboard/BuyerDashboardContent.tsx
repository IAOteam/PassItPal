import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { IOrder } from '@passitpal/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 

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
import useAuthStore from '@/hooks/zustand/useAuthStore';
import toast from 'react-hot-toast';

// --- API Fetching Functions ---
const fetchMyOrders = async (): Promise<IOrder[]> => {
    const response = await api.get('/orders/me');
    return response.data.orders || [];
};

const BuyerDashboardContent: React.FC = () => {
  const navigate = useNavigate();
  const { getOrCreateConversation } = useAuthStore();
  const queryClient = useQueryClient(); // Get the query client instance

  // --- TanStack Query Hook for fetching data ---
  const { data: orders, isLoading, isError, error } = useQuery<IOrder[], Error>({
    queryKey: ['myOrders'], // A unique key for this query
    queryFn: fetchMyOrders, // The function that fetches the data
  });

  // --- TanStack Mutation Hook for cancelling an order ---
  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) => api.put(`/orders/${orderId}/cancel`),
    onSuccess: () => {
      toast.success("Order cancelled successfully!");
      // Invalidate the 'myOrders' query to automatically refetch the data
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to cancel order.");
    }
  });
  
  // --- TanStack Mutation Hook for completing an order ---
  const completeOrderMutation = useMutation({
    mutationFn: (orderId: string) => api.post(`/orders/${orderId}/complete`),
    onSuccess: () => {
        toast.success("Deal completed successfully!");
        queryClient.invalidateQueries({ queryKey: ['myOrders'] });
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to complete the deal.");
    }
  });


  const handleContactSeller = async (sellerId: string) => {
    try {
      const conversationId = await getOrCreateConversation(sellerId);
      navigate(`/messages/${conversationId}`);
    } catch (err: any) {
      toast.error(err.message || "Could not start chat.");
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order request?")) return;
    cancelOrderMutation.mutate(orderId);
  };
  
  const handleConfirmReceipt = (orderId: string) => {
    if (!window.confirm("Please confirm only if you have received and verified the pass/ticket. This action is final and will complete the transaction.")) return;
    completeOrderMutation.mutate(orderId);
  };

  const getStatusBadgeVariant = (status: IOrder['status']) => {
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

        {isLoading && (
          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">Loading your orders...</div>
        )}

        {isError && (
          <div className="text-center text-red-500 font-medium">{error.message}</div>
        )}

        {!isLoading && !isError && (
          orders && orders.length > 0 ? (
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
                                disabled={cancelOrderMutation.isPending}
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
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleConfirmReceipt(order._id)} disabled={completeOrderMutation.isPending}>
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
