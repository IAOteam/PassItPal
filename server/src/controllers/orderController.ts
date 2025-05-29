// src/controllers/orderController.ts
import { Request, Response } from 'express';
import Listing from '../models/Listing';

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