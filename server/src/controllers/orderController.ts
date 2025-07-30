import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';

const sendSuccess = (res: Response, message: string, data: object = {}, statusCode = 200) => {
    res.status(statusCode).json({ message, ...data });
};

const sendError = (res: Response, error: any, defaultMessage: string) => {
    console.error(`Error in OrderController: ${error.message}`);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || defaultMessage });
};

export const initiateOrder = async (req: Request, res: Response) => {
    try {
        const { listingId } = req.params;
        const { offerPrice, messageToSeller } = req.body;
        const buyer = req.user;

        if (!buyer?._id || !buyer.username) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }

        const order = await OrderService.initiateOrder(listingId, buyer._id.toString(), buyer.username, offerPrice, messageToSeller);
        sendSuccess(res, 'Offer submitted successfully. The seller has been notified.', { order }, 201);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not initiate order.');
    }
};

export const getListingOrders = async (req: Request, res: Response) => {
    try {
        const sellerId = req.user?._id.toString();
        if (!sellerId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const orders = await OrderService.getOrdersForSeller(sellerId);
        sendSuccess(res, 'Seller orders fetched successfully.', { orders });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch orders.');
    }
};

export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const buyerId = req.user?._id.toString();
        if (!buyerId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const orders = await OrderService.getMyOrders(buyerId);
        sendSuccess(res, 'Your orders fetched successfully.', { orders });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch your orders.');
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'
        const sellerId = req.user?._id.toString();

        if (!sellerId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        if (status !== 'accepted' && status !== 'rejected') {
            return res.status(400).json({ message: "Invalid status. Must be 'accepted' or 'rejected'." });
        }

        const order = await OrderService.updateOrderStatus(orderId, sellerId, status);
        sendSuccess(res, `Order has been ${status}.`, { order });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not update order status.');
    }
};

export const cancelOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const buyerId = req.user?._id.toString();
        if (!buyerId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const order = await OrderService.cancelOrder(orderId, buyerId);
        sendSuccess(res, 'Your offer has been cancelled.', { order });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not cancel order.');
    }
};

export const completeOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const buyerId = req.user?._id.toString();
        if (!buyerId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const order = await OrderService.completeOrder(orderId, buyerId);
        sendSuccess(res, 'Transaction completed successfully! Thank you for using Passitpal.', { order });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not complete order.');
    }
};
