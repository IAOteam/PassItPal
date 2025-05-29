
import { Request, Response } from 'express';
import Listing, { IListing } from '../models/Listing';

import User from '../models/User';
import { createAndEmitNotification } from './notificationController';
import { Types } from 'mongoose';
import Order, { IOrder } from "../models/Order";

// @route   POST /api/orders/initiate/:listingId
// @desc    Initiate an order/make an offer on a listing
// @access  Private (Buyer only)
export const initiateOrder = async (req: Request, res: Response) => {
  const { listingId } = req.params;
  const { offerPrice, messageToSeller } = req.body;
  const buyerId = req.user?._id; // Buyer's ID from the token

  try {
    if (!buyerId) {
      return res.status(401).json({ message: 'Not authorized: Buyer not logged in.' });
    }

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // Ensure the listing is available
    if (!listing.isAvailable) {
      return res.status(400).json({ message: 'This listing is not available for purchase.' });
    }

    // Prevent buyer from buying their own listing
    if (listing.seller.toString() === buyerId.toString()) {
      return res.status(400).json({ message: 'You cannot initiate an order on your own listing.' });
    }

    // Check if an order for this listing by this buyer is already pending
    const existingPendingOrder = await Order.findOne({
      buyer: buyerId,
      listing: listingId,
      status: 'pending'
    });

    if (existingPendingOrder) {
      return res.status(400).json({ message: 'You already have a pending order for this listing.' });
    }

    // Get seller information for the order
    const seller = await User.findById(listing.seller);
    if (!seller) {
      return res.status(404).json({ message: 'Seller for this listing not found.' });
    }

    // Create the new order
    const newOrder = new Order({
      buyer: buyerId,
      seller: listing.seller,
      listing: listingId,
      offerPrice: offerPrice,
      messageToSeller: messageToSeller,
      status: 'pending', // Initial status
      paymentStatus: 'pending' // Initial payment status
    });

    const order = await newOrder.save() as IOrder & { _id: Types.ObjectId }; // Explicitly cast to IOrder with _id type

    // Optionally, mark the listing as temporarily unavailable (e.g., 'on_hold')
    // For now, we'll keep it available until seller accepts.
    // listing.isAvailable = false;
    // await listing.save();

    // Notify the seller about the new order/offer
    await createAndEmitNotification(
      listing.seller.toString(),
      'new_order',
      `You have a new offer of ₹${offerPrice} for your listing "${listing.cultPassType}".`,
      `/order/${order._id.toString()}` // Link to the new order details page (future)
    );

    res.status(201).json({
      message: 'Order initiated successfully. Seller has been notified.',
      order: {
        id: order._id,
        listing: order.listing,
        offerPrice: order.offerPrice,
        status: order.status,
        paymentStatus: order.paymentStatus
      }
    });

  } catch (error: any) {
    console.error('Error initiating order:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid listing ID or user ID.' });
    }
    res.status(500).json({ message: 'Server error: Could not initiate order.' });
  }
};

// @route   GET /api/orders/seller
// @desc    Get all orders for listings owned by the logged-in seller
// @access  Private (Seller only)
export const getListingOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can view orders on their listings.' });
    }

    // Find all listings belonging to the seller
    const sellerListings = await Listing.find({ seller: req.user._id }).select('_id');
    const listingIds = sellerListings.map(listing => listing._id);

    // Find all orders associated with these listings
    
    const orders = await Order.find({ listing: { $in: listingIds } })
      .populate('buyer', 'username email profilePictureUrl') // Populate buyer details
      .populate('listing', 'cultPassType askingPrice adImageUrl') // Populate listing details
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({ message: 'Orders fetched successfully', orders });
  } catch (error: any) {
    console.error('Error fetching seller listings orders:', error.message);
    res.status(500).json({ message: 'Server error: Could not fetch seller orders.' });
  }
};

// @route   GET /api/orders/me
// @desc    Get all orders initiated by the logged-in buyer
// @access  Private (Buyer only)
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers can view their own initiated orders.' });
    }

    const orders = await Order.find({ buyer: req.user._id })
      .populate('seller', 'username email mobileNumber profilePictureUrl') // Populate seller details
      .populate('listing', 'cultPassType askingPrice adImageUrl isAvailable') // Populate listing details
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({ message: 'My orders fetched successfully', orders });
  } catch (error: any) {
    console.error('Error fetching buyer orders:', error.message);
    res.status(500).json({ message: 'Server error: Could not fetch your orders.' });
  }
};

// src/controllers/orderController.ts (add this function)

// @route   PUT /api/orders/:orderId/status
// @desc    Update the status of an order (e.g., accept, reject, complete)
// @access  Private (Seller only)
export const updateOrderStatus = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body; // Expected status: 'accepted' | 'rejected' | 'completed' | 'cancelled' (optional, buyer initiated)
  const sellerId = req.user?._id; // Seller's ID from the token

  try {
    if (!sellerId || req.user?.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers are authorized to update order status.' });
    }
    const order = await Order.findById(orderId).populate('listing') as IOrder & { _id: Types.ObjectId; listing: IListing }; // Populate listing to access its details

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Ensure the logged-in user is the seller of this order's listing
    if (order.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this order.' });
    }

    // Validate the new status
    const validSellerStatuses = ['accepted', 'rejected', 'completed']; // Seller can set these
    if (!validSellerStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided. Valid statuses are: accepted, rejected, completed.' });
    }

    // Prevent status changes if already completed or cancelled (unless specific business logic allows)
    if (order.status === 'completed' || order.status === 'cancelled') {
        return res.status(400).json({ message: `Order is already ${order.status} and cannot be updated.` });
    }

    // Specific logic based on status update
    if (status === 'accepted') {
        // If accepted, check if listing is available. If not, it means another order was accepted.
        if (order.listing && !order.listing.isAvailable && order.listing.seller.toString() === sellerId.toString()) {
            return res.status(400).json({ message: 'Listing is already marked as unavailable by another accepted order.' });
        }
        // Mark listing as unavailable if order is accepted (assuming one pass per listing)
        if (order.listing) {
            order.listing.isAvailable = false;
            await order.listing.save();
        }

        // Notify buyer that their offer was accepted
        await createAndEmitNotification(
            order.buyer.toString(),
            'transaction', // or a more specific 'order_accepted' type
            `Your offer for "${order.listing?.cultPassType}" was accepted by the seller!`,
            `/order/${order._id.toString()}` // Link to the order details
        );

    } else if (status === 'rejected') {
        // If rejected, the listing might become available again if it was put on hold (current logic keeps it available initially)
        // No change to listing.isAvailable unless it was previously set to false by this order.
        // If multiple pending orders, this just rejects one.

        // Notify buyer that their offer was rejected
        await createAndEmitNotification(
            order.buyer.toString(),
            'transaction', // or 'order_rejected'
            `Your offer for "${order.listing?.cultPassType}" was rejected by the seller.`,
            `/order/${order._id.toString()}`
        );

    } else if (status === 'completed') {
        // 'completed' implies payment is handled externally and confirmed.
        // Ensure status sequence: pending -> accepted -> completed
        if (order.status !== 'accepted') {
            return res.status(400).json({ message: 'Order must be accepted before it can be marked as completed.' });
        }
        // Ensure listing is marked unavailable. If not, mark it.
        if (order.listing && order.listing.isAvailable) {
             order.listing.isAvailable = false;
             await order.listing.save();
        }

        order.paymentStatus = 'paid'; // Assume payment is confirmed upon completion
        // Notify buyer that the transaction is completed
        await createAndEmitNotification(
            order.buyer.toString(),
            'transaction', // or 'order_completed'
            `Your transaction for "${order.listing?.cultPassType}" is completed!`,
            `/order/${order._id.toString()}`
        );
    }

    order.status = status;
    order.updatedAt = new Date(); // Manually update updatedAt as save() might not trigger it directly with partial updates
    await order.save();

    res.status(200).json({ message: `Order status updated to ${status} successfully.`, order });

  } catch (error: any) {
    console.error('Error updating order status:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid order ID.' });
    }
    res.status(500).json({ message: 'Server error: Could not update order status.' });
  }
};