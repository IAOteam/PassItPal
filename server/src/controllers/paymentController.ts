import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

const sendSuccess = (res: Response, message: string, data: object = {}, statusCode = 200) => {
    res.status(statusCode).json({ message, ...data });
};

const sendError = (res: Response, error: any, defaultMessage: string) => {
    console.error(`Error in PaymentController: ${error.message}`);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || defaultMessage });
};

export const createRazorpayOrder = async (req: Request, res: Response) => {
    try {
        const { amount, listingId } = req.body;
        const userId = req.user?._id.toString();
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const order = await PaymentService.createListingPromotionOrder(amount, listingId, userId);
        res.status(200).json(order);
    } catch (error: any) {
        sendError(res, error, 'Server error while creating payment order.');
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        await PaymentService.verifyListingPromotionPayment({ ...req.body, userId });
        sendSuccess(res, 'Payment verified successfully. Listing promoted!');
    } catch (error: any) {
        sendError(res, error, 'Payment verification failed.');
    }
};

export const createAdPaymentOrder = async (req: Request, res: Response) => {
    try {
        const order = await PaymentService.createAdPaymentOrder(req.params.adId);
        res.status(200).json(order);
    } catch (error: any) {
        sendError(res, error, 'Server error while creating ad payment order.');
    }
};

export const verifyAdPayment = async (req: Request, res: Response) => {
    try {
        await PaymentService.verifyAdPayment(req.body);
        sendSuccess(res, 'Payment successful! Your ad is now live.');
    } catch (error: any) {
        sendError(res, error, 'Invalid payment signature.');
    }
};
