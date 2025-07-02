import Listing from '../models/Listing';

const listingExpiryProcessor = async () => {
  console.log(`[Cron - ListingExpiry] Running job at ${new Date().toISOString()}`);
  try {
    const now = new Date();
    const result = await Listing.updateMany(
      { isAvailable: true, expiryDate: { $lt: now } },
      { $set: { isAvailable: false } }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Cron - ListingExpiry] Successfully expired ${result.modifiedCount} listings.`);
    } else {
      console.log('[Cron - ListingExpiry] No listings to expire.');
    }
  } catch (error) {
    console.error('[Cron - ListingExpiry] Error running listing expiry job:', error);
  }
};

export default listingExpiryProcessor;