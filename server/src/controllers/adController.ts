// server/src/controllers/adController.ts

import { Request, Response } from 'express';
import Ad from '../models/Ad';
// Import notification controller if you want to notify admins of new submissions
// import { createAndEmitNotification } from './notificationController';

// @route   POST /api/ads/submit
// @desc    Allow public users to submit an ad for review
// @access  Public
export const submitAdForReview = async (req: Request, res: Response) => {
    try {
        const {
            sponsorName,
            adTitle,
            adDescription,
            targetUrl,
            locations, // Expecting an array of strings
            durationDays,
            adImageBase64 // Assuming you might handle image upload
        } = req.body;

        // Image upload logic can be added here if needed, for now we assume URL
        // For simplicity, we'll assume imageUrl is passed directly or handle later.

        const newAd = new Ad({
            sponsorName,
            adTitle,
            adDescription,
            targetUrl,
            locations,
            durationDays,
            approvalStatus: 'pending', // Always pending on submission
            isActive: false,           // Never active on submission
            imageUrl: "https://placehold.co/600x400/cccccc/FFFFFF?text=Ad+Pending" // Placeholder
        });

        await newAd.save();

        // Optional: Notify all admins about the new submission
        // const admins = await User.find({ role: 'admin' });
        // ... loop and call createAndEmitNotification ...

        res.status(201).json({ message: 'Ad submitted for review successfully. We will contact you shortly.' });

    } catch (error: any) {
        console.error('Error submitting ad for review:', error);
        res.status(500).json({ message: 'Server error while submitting your ad.' });
    }
};


/*You've outlined a self-service Ads Management System. This is a fantastic long-term vision. However, building a complete self-service system (submission form, admin approval queue, automated payment links, ad expiry jobs) is a significant development effort.

Given our current goal to launch quickly with no budget, I recommend a leaner, manual approach for the MVP. This lets us validate demand for ads before investing weeks of development.

The Lean MVP Alternative :

"Advertise With Us" Page: Create a simple static page with a "Contact Us" button (mailto: link) that opens the user's email client. The page will list ad specs and pricing.

Manual Process:

An advertiser emails you their ad details.

You (as the admin) use your existing Admin Panel to manually create the ad via a new "Create Ad" form.

You manually generate a Razorpay Payment Link and email it to them.

Once they pay, you manually set the ad to "Active" in the Admin Panel.

This approach requires less than 20% of the development time and gets us to market faster, allowing us to focus on the core user-to-user marketplace.
*/