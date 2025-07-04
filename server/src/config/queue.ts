import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // Important for BullMQ
});

if (!process.env.REDIS_URL) {
  // console.error("CRITICAL: REDIS_URL not found in environment variables.");
  process.exit(1);
}

// Create a queue for sending email notifications
export const emailQueue = new Queue('email-notification-queue', { connection });

// Define a function to create a worker for processing jobs.
// We do this in a function so we can initialize it in our main app.ts file.
export const createEmailWorker = (processor: (job: any) => Promise<void>) => {
  const worker = new Worker('email-notification-queue', processor, { connection });

  worker.on('completed', job => {
    // console.log(`[Worker] Job ${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} has failed with error: ${err.message}`);
  });

  return worker;
};

// console.log("BullMQ Queue and Worker configured.");
