import { Request, Response } from 'express';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Listing from '../models/Listing';
import User from '../models/User'; //  Import User model
import { createAndEmitNotification } from './notificationController';
import { sendEmail } from '../utils/emailService'; //  Import email service
import Ad from '../models/Ad';
dotenv.config();


// Ensure Razorpay keys are loaded
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Razorpay API keys are not configured in environment variables.');
}

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   POST /api/payments/create-order
// @desc    Create a Razorpay order for promoting a listing
// @access  Private (Seller)
export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', listingId } = req.body;
    const userId = req.user?._id;

    if (!amount || !listingId) {
      return res.status(400).json({ message: 'Amount and listingId are required.' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    if (listing.seller.toString() !== userId?.toString()) {
        return res.status(403).json({ message: 'You are not authorized to promote this listing.' });
    }

    const options = {
      amount: amount * 100, // Amount in the smallest currency unit (e.g., paise for INR)
      currency,
      receipt: `receipt_listing_${listingId}`,
      notes: {
          listingId: listingId.toString(),
          userId: userId?.toString(),
      }
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Server error while creating payment order.' });
  }
};

// @route   POST /api/payments/verify
// @desc    Verify the payment signature and update the listing
// @access  Private (Seller)
export const verifyPayment = async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, listingId } = req.body;
  const userId = req.user?._id;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !listingId) {
    return res.status(400).json({ message: 'Payment verification details are incomplete.' });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest('hex');

  const isAuthentic = expectedSignature === razorpay_signature;

  // Find the listing and user regardless of payment status to send emails
  const listing = await Listing.findById(listingId);
  const user = await User.findById(userId);

  if (!listing || !user) {
    return res.status(404).json({ message: "Could not find associated listing or user." });
  }

  if (isAuthentic) {
    // Payment is authentic, now update the listing in the database
    listing.isPromoted = true;
    const now = new Date();
    listing.promotionExpiresAt = new Date(now.setDate(now.getDate() + 7));
    await listing.save();

    // Send real-time notification
    await createAndEmitNotification(
        listing.seller.toString(),
        'promoted_listing',
        `Your listing "${listing.cultPassType}" has been successfully promoted!`,
        { type: 'listing', id: listing._id.toString() }
    );
    
    // NEW: Send success email
    try {
        const subject = `✅ Payment Successful: Your listing is now promoted!`;
        const text = `Hi ${user.username},\n\nYour payment for promoting the listing "${listing.cultPassType}" was successful. It is now promoted for 7 days.\n\nThank you for using Passitpal!`;
        const html = `<p>Hi ${user.username},</p><p>Your payment for promoting the listing "<strong>${listing.cultPassType}</strong>" was successful. It is now promoted for 7 days.</p><p>Thank you for using Passitpal!</p>`;
        await sendEmail(user.email, subject, text, html);
    } catch (emailError) {
        console.error("Failed to send payment success email:", emailError);
        // Do not fail the request if email sending fails
    }

    res.status(200).json({ message: 'Payment verified successfully. Listing promoted!' });
  } else {
    // NEW: Send failure email
    try {
        const subject = `❌ Payment Failed: Promotion for your listing`;
        const text = `Hi ${user.username},\n\nWe were unable to verify the payment for promoting your listing "${listing.cultPassType}". Please try again. If you believe this is an error, please contact our support.\n\nThank you,\nThe Passitpal Team`;
        const html = `<p>Hi ${user.username},</p><p>We were unable to verify the payment for promoting your listing "<strong>${listing.cultPassType}</strong>". Please try again. If you believe this is an error, please contact our support.</p><p>Thank you,<br>The Passitpal Team</p>`;
        await sendEmail(user.email, subject, text, html);
    } catch (emailError) {
        console.error("Failed to send payment failure email:", emailError);
    }

    res.status(400).json({ message: 'Invalid payment signature. Payment verification failed.' });
  }
};

// @route   POST /api/payments/ads/:adId/create-order
// @desc    Create a Razorpay order for an approved ad
// @access  Public (but link is unguessable)
export const createAdPaymentOrder = async (req: Request, res: Response) => {
    try {
        const ad = await Ad.findById(req.params.adId);
        if (!ad || ad.approvalStatus !== 'approved' || ad.isActive) {
            return res.status(404).json({ message: 'Approved ad not found or already active.' });
        }

        // Let's assume price is stored on the ad. If not, you'd calculate it here.
        const amount = ad.price;
        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_ad_${ad._id}`,
            notes: { adId: String(ad._id) }
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating payment order.' });
    }
};

// @route   POST /api/payments/ads/verify
// @desc    Verify ad payment and activate the ad
// @access  Public
export const verifyAdPayment = async (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, adId } = req.body;

    // Signature verification (same as your existing verifyPayment function)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
                                .update(body.toString()).digest('hex');

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid payment signature.' });
    }

    // Signature is valid, activate the ad
    const ad = await Ad.findById(adId);
    if (!ad) {
        return res.status(404).json({ message: 'Ad not found.' });
    }

    ad.isActive = true;
    const now = new Date();
    ad.expiresAt = new Date(now.setDate(now.getDate() + ad.durationDays));
    await ad.save();

    res.status(200).json({ message: 'Payment successful! Your ad is now live.' });
};
