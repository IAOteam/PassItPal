import Listing from '../models/Listing';

const listingExpiryProcessor = async () => {
  // console.log(`[Cron - ListingExpiry] Running job at ${new Date().toISOString()}`);
  try {
    const now = new Date();
    const expiryResult = await Listing.updateMany(
      { status: 'available', expiryDate: { $lt: now } },
      { $set: { status: 'expired' } }
    );

    if (expiryResult.modifiedCount > 0) {
      // console.log(`[Cron - ListingExpiry] Successfully expired ${result.modifiedCount} listings.`);
    } 
  

    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    const deactivationResult = await Listing.updateMany(
      { status: 'available', createdAt: { $lt: thirtyDaysAgo } },
      { $set: { status: 'deactivated' } }
    );

    if (deactivationResult.modifiedCount > 0) {
      console.log(`[Cron - ListingExpiry] Successfully deactivated ${deactivationResult.modifiedCount} stale listings.`);
    }

  } catch (error) {
    console.error('[Cron - ListingExpiry] Error running listing expiry job:', error);
  }
};

export default listingExpiryProcessor;