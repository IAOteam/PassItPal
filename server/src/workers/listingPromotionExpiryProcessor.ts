// server/src/workers/listingPromotionExpiryProcessor.ts
import Listing from '../models/Listing';
import { NotificationService } from '../services/notification.service';

/**
 * This processor is designed to be run as a cron job.
 * It finds all listings where the promotion has expired and deactivates the promotion.
 */
const listingPromotionExpiryProcessor = async () => {
  console.log(`[Cron - PromotionExpiry] Running job at ${new Date().toISOString()}`);
  try {
    const now = new Date();
    
    // Find listings that are promoted and whose expiry date is in the past
    const expiredPromotions = await Listing.find({
      isPromoted: true,
      promotionExpiresAt: { $lt: now },
    });

    if (expiredPromotions.length === 0) {
      console.log('[Cron - PromotionExpiry] No listing promotions to expire.');
      return;
    }

    const idsToExpire = expiredPromotions.map(listing => listing._id);

    // Update them in the database
    const result = await Listing.updateMany(
      { _id: { $in: idsToExpire } },
      { $set: { isPromoted: false } }
    );

    console.log(`[Cron - PromotionExpiry] Successfully expired ${result.modifiedCount} listing promotions.`);

    // Optionally, notify the sellers that their promotion has ended
    const notificationPromises = expiredPromotions.map(listing => 
        NotificationService.createAndEmitNotification(
            listing.seller.toString(),
            'listing_update',
            `Your promotion for "${listing.cultPassType}" has ended.`,
            { type: 'listing', id: listing._id.toString() }
        )
    );
    await Promise.all(notificationPromises);

  } catch (error) {
    console.error('[Cron - PromotionExpiry] Error running listing promotion expiry job:', error);
  }
};

export default listingPromotionExpiryProcessor;
