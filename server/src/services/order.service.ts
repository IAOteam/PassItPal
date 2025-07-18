import Order, { IOrder } from '../models/Order';
import Listing, { IListing } from '../models/Listing';
import User from '../models/User';
import { NotificationService } from './notification.service';
import { sendEmail } from '../utils/emailService';
import mongoose, { Types } from 'mongoose';
import { toPlainObject } from '../utils/mongooseUtils';

class HttpError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class OrderService {
    /**
     * Initiates a new order (offer) on a listing from a buyer.
     */
   public static async initiateOrder(listingId: string, buyerId: string, buyerUsername: string, offerPrice: number, messageToSeller?: string): Promise<Partial<IOrder>> {
        const session = await mongoose.startSession();
        try {
            let createdOrder;
            await session.withTransaction(async () => {
                const listing = await Listing.findById(listingId).session(session);
                if (!listing) { throw new HttpError('Listing not found.', 404); }
                if (!listing.isAvailable) { throw new HttpError('This listing is no longer available.', 400); }
                if (listing.seller.toString() === buyerId) { throw new HttpError('You cannot make an offer on your own listing.', 400); }
                if (await Order.findOne({ buyer: buyerId, listing: listingId, status: 'pending' }).session(session)) {
                    throw new HttpError('You already have a pending offer for this listing.', 409);
                }

                const seller = await User.findById(listing.seller).session(session);
                if (!seller) { throw new HttpError('Seller for this listing could not be found.', 404); }

                const newOrder = new Order({
                    buyer: buyerId, seller: listing.seller, listing: listingId,
                    offerPrice: offerPrice, messageToSeller: messageToSeller,
                });
                createdOrder = await newOrder.save({ session });

                const emailSubject = `You've Received a New Offer on Passitpal!`;
                const emailHtml = `<p>Hi ${seller.username},</p><p>You've received a new offer of ₹${offerPrice} for your listing "<strong>${listing.cultPassType}</strong>" from ${buyerUsername}.</p><p>Please log in to your dashboard to review the offer.</p>`;
                sendEmail(seller.email, emailSubject, '', emailHtml).catch(e => console.error("Failed to send new order email:", e));

                await NotificationService.createAndEmitNotification(
                    listing.seller.toString(), 'new_order', `You have a new offer of ₹${offerPrice} for "${listing.cultPassType}".`,
                    { type: 'profile', id: seller._id.toString() }
                );
            });
            if (!createdOrder) { throw new Error('Order creation failed within transaction.'); }
            return toPlainObject<IOrder>(createdOrder);
        } catch (error: any) {
            console.error('Transaction aborted for initiateOrder:', error.message);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Fetches all orders for the listings owned by a seller.
     */
    public static async getOrdersForSeller(sellerId: string): Promise<Partial<IOrder>[]> {
        const orders = await Order.find({ seller: sellerId })
            .populate('buyer', 'username email profilePictureUrl')
            .populate('listing', 'cultPassType askingPrice adImageUrl')
            .sort({ createdAt: -1 });
        return orders.map(order => toPlainObject<IOrder>(order));
    }

    /**
     * Fetches all orders initiated by a buyer.
     */
    public static async getMyOrders(buyerId: string): Promise<Partial<IOrder>[]> {
        const orders = await Order.find({ buyer: buyerId })
            .populate('seller', 'username email profilePictureUrl')
            .populate('listing', 'cultPassType askingPrice adImageUrl isAvailable')
            .sort({ createdAt: -1 });
        return orders.map(order => toPlainObject<IOrder>(order));
    }


    /**
     * Updates the status of an order (by the seller).
     */
   public static async updateOrderStatus(orderId: string, sellerId: string, newStatus: 'accepted' | 'rejected'): Promise<Partial<IOrder>> {
        const session = await mongoose.startSession();
        try {
            let updatedOrder;
            await session.withTransaction(async () => {
                const order = await Order.findById(orderId).populate('listing').session(session) as IOrder & { listing: IListing };
                if (!order) { throw new HttpError('Order not found.', 404); }
                if (order.seller.toString() !== sellerId) { throw new HttpError('You are not authorized to update this order.', 403); }
                if (order.status !== 'pending') { throw new HttpError(`Order is already ${order.status} and cannot be updated.`, 400); }

                order.status = newStatus;
                let notificationMessage = '';

                if (newStatus === 'accepted') {
                    if (!order.listing.isAvailable) { throw new HttpError('This listing has already been sold.', 409); }
                    await Listing.findByIdAndUpdate(order.listing._id, { isAvailable: false }, { session });
                    notificationMessage = `Your offer for "${order.listing.cultPassType}" was accepted!`;
                } else {
                    notificationMessage = `Your offer for "${order.listing.cultPassType}" was rejected.`;
                }

                updatedOrder = await order.save({ session });
                await NotificationService.createAndEmitNotification(
                    order.buyer.toString(), 'transaction', notificationMessage, { type: 'profile', id: order.buyer.toString() }
                );
            });
            if (!updatedOrder) { throw new Error('Order update failed within transaction.'); }
            return toPlainObject<IOrder>(updatedOrder);
        } catch (error: any) {
            console.error('Transaction aborted for updateOrderStatus:', error.message);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Allows a buyer to cancel their own pending order.
     */
    public static async cancelOrder(orderId: string, buyerId: string): Promise<Partial<IOrder>> {
        const session = await mongoose.startSession();
        try {
            let cancelledOrder;
            await session.withTransaction(async () => {
                const order = await Order.findById(orderId).populate('listing').session(session) as IOrder & { listing: IListing };
                if (!order) { throw new HttpError('Order not found.', 404); }
                if (order.buyer.toString() !== buyerId) { throw new HttpError('You are not authorized to cancel this order.', 403); }
                if (order.status !== 'pending') { throw new HttpError(`Order cannot be cancelled as it is already ${order.status}.`, 400); }

                order.status = 'cancelled';
                cancelledOrder = await order.save({ session });
                await NotificationService.createAndEmitNotification(
                    order.seller.toString(), 'order_cancelled', `The offer for "${order.listing.cultPassType}" was cancelled by the buyer.`, { type: 'profile', id: order.seller.toString() }
                );
            });
            if (!cancelledOrder) { throw new Error('Order cancellation failed within transaction.'); }
            return toPlainObject<IOrder>(cancelledOrder);
        } catch (error: any) {
            console.error('Transaction aborted for cancelOrder:', error.message);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Allows a buyer to confirm completion of a transaction.
     */
    public static async completeOrder(orderId: string, buyerId: string): Promise<Partial<IOrder>> {
        const session = await mongoose.startSession();
        try {
            let completedOrder;
            await session.withTransaction(async () => {
                const order = await Order.findById(orderId).session(session);
                if (!order) { throw new HttpError('Order not found.', 404); }
                if (order.buyer.toString() !== buyerId) { throw new HttpError('You are not authorized to complete this order.', 403); }
                if (order.status !== 'accepted') { throw new HttpError(`Cannot complete order with status: ${order.status}.`, 400); }

                order.status = 'completed';
                order.paymentStatus = 'paid';
                completedOrder = await order.save({ session });

                await Listing.findByIdAndUpdate(order.listing, { isAvailable: false }, { session });

                await NotificationService.createAndEmitNotification(
                    order.seller.toString(), 'transaction', `The buyer has confirmed the deal for order #${order._id?.toString().slice(-6)} is complete!`, { type: 'profile', id: order.seller.toString() }
                );
            });
            if (!completedOrder) { throw new Error('Order completion failed within transaction.'); }
            return toPlainObject<IOrder>(completedOrder);
        } catch (error: any) {
            console.error('Transaction aborted for completeOrder:', error.message);
            throw error;
        } finally {
            await session.endSession();
        }
    }
}
