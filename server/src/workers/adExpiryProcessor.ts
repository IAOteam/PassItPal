// server/src/workers/adExpiryProcessor.ts

import Ad from '../models/Ad';

const adExpiryProcessor = async () => {
  // console.log(`[Cron - AdExpiry] Running job at ${new Date().toISOString()}`);
  try {
    const now = new Date();
    const expiredAds = await Ad.find({
      isActive: true,
      expiresAt: { $lt: now },
    });

    if (expiredAds.length === 0) {
      // console.log('[Cron - AdExpiry] No active ads to expire.');
      return;
    }

    const idsToExpire = expiredAds.map(ad => ad._id);

    const result = await Ad.updateMany(
      { _id: { $in: idsToExpire } },
      { $set: { isActive: false } }
    );

    // console.log(`[Cron - AdExpiry] Successfully expired ${result.modifiedCount} ads.`);

  } catch (error) {
    console.error('[Cron - AdExpiry] Error running ad expiry job:', error);
  }
};

export default adExpiryProcessor;