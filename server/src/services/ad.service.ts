import Ad, { IAd } from '../models/Ad';
import User from '../models/User';
import { v2 as cloudinary } from 'cloudinary';
import { NotificationService } from '../services/notification.service';
import { sendEmail } from '../utils/emailService';
import { toPlainObject } from '../utils/mongooseUtils';

class HttpError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class AdService {
    /**
     * Allows a public user to submit an ad for review.
     * This will notify all admins of the new submission.
     */
    public static async submitForReview(adData: any): Promise<Partial<IAd>> {
        const { sponsorName, adTitle, adDescription, targetUrl, locations, durationDays, adImageBase64 } = adData;

        let imageUrl = "https://placehold.co/600x400/cccccc/FFFFFF?text=Ad+Pending";
        if (adImageBase64) {
             const uploadResponse = await cloudinary.uploader.upload(adImageBase64, {
                upload_preset: 'passitpal_ads',
                folder: 'ads'
            });
            imageUrl = uploadResponse.secure_url;
        }

        const newAd = new Ad({
            sponsorName, adTitle, adDescription, targetUrl, locations, durationDays,
            approvalStatus: 'pending', isActive: false, imageUrl
        });
        await newAd.save();

        const admins = await User.find({ role: 'admin' }).select('_id');
        const notificationPromises = admins.map(admin =>
            NotificationService.createAndEmitNotification(
                admin._id.toString(), 'admin_alert', `New ad "${adTitle}" submitted for review.`,
                { type: 'profile', id: admin._id.toString() }
            )
        );
        await Promise.all(notificationPromises);

        return toPlainObject<IAd>(newAd);
    }
    // --- Admin-facing Ad Management ---
    /**
     * Fetches all ads and returns them as plain objects.
     */
    public static async getAllAds(): Promise<Partial<IAd>[]> {
        const ads = await Ad.find({}).sort({ createdAt: -1 });
        return ads.map(ad => toPlainObject<IAd>(ad));
    }
    /**
     * Creates a new ad (by an admin) and returns a plain object representation.
     */
    public static async createAd(adData: Partial<IAd> & { adImageBase64: string }): Promise<Partial<IAd>> {
        const { adImageBase64, ...restOfAdData } = adData;
        if (!adImageBase64) { throw new HttpError('Ad image is required.', 400); }
        
        const uploadResponse = await cloudinary.uploader.upload(adImageBase64, {
            upload_preset: 'passitpal_ads', folder: 'ads'
        });
        
        const newAd = new Ad({ ...restOfAdData, imageUrl: uploadResponse.secure_url });
        await newAd.save();
        return toPlainObject<IAd>(newAd);
    }
    /**
     * Updates an ad and returns the updated ad as a plain object.
     */
    public static async updateAd(adId: string, updateData: Partial<IAd> & { adImageBase64?: string }): Promise<Partial<IAd>> {
        if (updateData.adImageBase64) {
            const uploadResponse = await cloudinary.uploader.upload(updateData.adImageBase64, {
                upload_preset: 'passitpal_ads', folder: 'ads'
            });
            updateData.imageUrl = uploadResponse.secure_url;
            delete updateData.adImageBase64;
        }
        
        const updatedAd = await Ad.findByIdAndUpdate(adId, updateData, { new: true });
        if (!updatedAd) { throw new HttpError('Ad not found.', 404); }
        
        return toPlainObject<IAd>(updatedAd);
    }

    public static async deleteAd(adId: string): Promise<void> {
        const deletedAd = await Ad.findByIdAndDelete(adId);
        if (!deletedAd) {
            throw new HttpError('Ad not found.', 404);
        }
    }
    /**
     * Approves an ad and returns the updated ad as a plain object.
     */
    public static async approveAd(adId: string): Promise<Partial<IAd>> {
        const ad = await Ad.findById(adId);
        if (!ad || ad.approvalStatus !== 'pending') { throw new HttpError('Pending ad not found.', 404); }
        
        ad.approvalStatus = 'approved';
        await ad.save();
        
        const paymentLink = `${process.env.CLIENT_URL}/ad-payment/${ad._id}`;
        const emailSubject = 'Your Ad on Passitpal has been Approved!';
        const emailHtml = `<p>Congratulations! Your ad, "<strong>${ad.adTitle}</strong>", has been approved. Please complete the payment to get it published:</p><a href="${paymentLink}">Pay Now</a>`;
        // await sendEmail('advertiser-email@example.com', emailSubject, '', emailHtml);
        
        return toPlainObject<IAd>(ad);
    }
    /**
     * Rejects an ad and returns the updated ad as a plain object.
     */
    public static async rejectAd(adId: string): Promise<Partial<IAd>> {
        const ad = await Ad.findById(adId);
        if (!ad || ad.approvalStatus !== 'pending') { throw new HttpError('Pending ad not found.', 404); }
        
        ad.approvalStatus = 'rejected';
        await ad.save();
        
        return toPlainObject<IAd>(ad);
    }
}
