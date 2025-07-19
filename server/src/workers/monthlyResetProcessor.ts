// server/src/workers/monthlyResetProcessor.ts
import User from '../models/User';

/**
 * This processor is designed to be run as a cron job at the beginning of each month.
 * It resets the 'monthlyListingCount' for all users back to zero.
 */
const monthlyResetProcessor = async () => {
  console.log(`[Cron - MonthlyReset] Running job at ${new Date().toISOString()}`);
  try {
    const result = await User.updateMany(
      {}, // An empty filter matches all users
      { $set: { monthlyListingCount: 0 } }
    );

    console.log(`[Cron - MonthlyReset] Successfully reset listing count for ${result.modifiedCount} users.`);

  } catch (error) {
    console.error('[Cron - MonthlyReset] Error running monthly reset job:', error);
  }
};

export default monthlyResetProcessor;
