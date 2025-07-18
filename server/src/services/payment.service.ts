import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Listing from '../models/Listing';
import User from '../models/User';
import Ad, { IAd } from '../models/Ad';
import { NotificationService } from './notification.service';
import { sendEmail } from '../utils/emailService';

dotenv.config();

// --- Error and Configuration ---

class HttpError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay API keys are not configured in environment variables.');
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export class PaymentService {
    /**
     * Creates a Razorpay order to promote a listing.
     * @param amount The amount for the order.
     * @param listingId The ID of the listing to be promoted.
     * @param userId The ID of the user promoting the listing.
     */
    public static async createListingPromotionOrder(amount: number, listingId: string, userId: string) {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            throw new HttpError('Listing not found.', 404);
        }
        if (listing.seller.toString() !== userId) {
            throw new HttpError('You are not authorized to promote this listing.', 403);
        }

        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_listing_${listingId}`,
            notes: {
                listingId: listingId.toString(),
                userId: userId.toString(),
                paymentType: 'listing_promotion'
            }
        };
        return razorpay.orders.create(options);
    }

    /**
     * Verifies a payment for a listing promotion, updates the listing, and sends notifications.
     * @param verificationData The payment verification data from Razorpay.
     */
    public static async verifyListingPromotionPayment(verificationData: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string, listingId: string, userId: string }) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, listingId, userId } = verificationData;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        const listing = await Listing.findById(listingId);
        const user = await User.findById(userId);

        if (!listing || !user) {
            throw new HttpError("Could not find the associated listing or user.", 404);
        }

        if (isAuthentic) {
            listing.isPromoted = true;
            const now = new Date();
            listing.promotionExpiresAt = new Date(now.setDate(now.getDate() + 7)); // Promote for 7 days
            await listing.save();

            await NotificationService.createAndEmitNotification(
                listing.seller.toString(),
                'promoted_listing',
                `Your listing "${listing.cultPassType}" has been successfully promoted!`,
                { type: 'listing', id: listing._id.toString() }
            );
            
            const subject = `✅ Payment Successful: Your listing is now promoted!`;
            const html = `<p>Hi ${user.username},</p><p>Your payment for promoting the listing "<strong>${listing.cultPassType}</strong>" was successful. It is now promoted for 7 days.</p><p>Thank you for using Passitpal!</p>`;
            await sendEmail(user.email, subject, '', html).catch(e => console.error("Failed to send payment success email:", e));

            return { success: true };

        } else {
            const subject = `❌ Payment Failed: Promotion for your listing`;
            const html = `<p>Hi ${user.username},</p><p>We were unable to verify the payment for promoting your listing "<strong>${listing.cultPassType}</strong>". Please try again or contact support.</p>`;
            await sendEmail(user.email, subject, '', html).catch(e => console.error("Failed to send payment failure email:", e));
            
            throw new HttpError('Invalid payment signature. Payment verification failed.', 400);
        }
    }

    /**
     * Creates a Razorpay order for an approved ad.
     * @param adId The ID of the ad to create a payment order for.
     */
    public static async createAdPaymentOrder(adId: string) {
        const ad = await Ad.findById(adId);
        if (!ad || ad.approvalStatus !== 'approved' || ad.isActive) {
            throw new HttpError('Approved ad not found or it is already active.', 404);
        }

        const amount = ad.price; // Assuming price is stored on the ad model
        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: `receipt_ad_${ad._id}`,
            notes: { adId: String(ad._id), paymentType: 'ad_payment' }
        };
        return razorpay.orders.create(options);
    }

    /**
     * Verifies a payment for an ad and activates it.
     * @param verificationData The payment verification data from Razorpay.
     */
    public static async verifyAdPayment(verificationData: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string, adId: string }) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, adId } = verificationData;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
                                .update(body).digest('hex');

        if (expectedSignature !== razorpay_signature) {
            throw new HttpError('Invalid payment signature.', 400);
        }

        const ad = await Ad.findById(adId);
        if (!ad) {
            throw new HttpError('Ad not found.', 404);
        }

        ad.isActive = true;
        const now = new Date();
        ad.expiresAt = new Date(now.setDate(now.getDate() + ad.durationDays));
        await ad.save();

        return { success: true };
    }
}
