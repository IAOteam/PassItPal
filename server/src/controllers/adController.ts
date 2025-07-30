import { Request, Response } from 'express';
import { AdService } from '../services/ad.service';

const sendSuccess = (res: Response, message: string, data: object = {}, statusCode = 200) => {
    res.status(statusCode).json({ message, ...data });
};

const sendError = (res: Response, error: any, defaultMessage: string) => {
    console.error(`Error in AdController: ${error.message}`);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || defaultMessage });
};

/**
 * @route   POST /api/ads/submit
 * @desc    Allow public users to submit an ad for review
 * @access  Public
 */
export const submitAdForReview = async (req: Request, res: Response) => {
    try {
        const ad = await AdService.submitForReview(req.body);
        sendSuccess(res, 'Ad submitted for review successfully. We will contact you shortly.', { ad }, 201);
    } catch (error: any) {
        sendError(res, error, 'Server error while submitting your ad.');
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