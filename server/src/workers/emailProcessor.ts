import { Job } from 'bullmq';
import { sendEmail } from '../utils/emailService';
import User from '../models/User';
import { getNewMessageNotificationTemplate } from '../utils/emailTemplates';

// Define the structure of the data we expect in our email jobs
interface EmailJobData {
  recipientId: string;
  senderName: string;
  messageText: string;
}

const emailProcessor = async (job: Job<EmailJobData>) => {
  const { recipientId, senderName, messageText } = job.data;
  
  try {
    // console.log(`[Worker] Processing job ${job.id} for recipient ${recipientId}`);
    
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      throw new Error(`Recipient with ID ${recipientId} not found.`);
    }

    if (!recipient.email) {
      throw new Error(`Recipient ${recipientId} does not have an email address.`);
    }

    const { subject, html } = getNewMessageNotificationTemplate(
        recipient.username || 'there',
        senderName,
        messageText.substring(0, 100) // a short preview
    );


    

    // Send the email
    await sendEmail(recipient.email, subject, '', html);

    // console.log(`[Worker] Successfully sent email for job ${job.id} to ${recipient.email}`);
  } catch (error: any) {
    console.error(`[Worker] Error processing job ${job.id}:`, error.message);
    // Throwing the error here will cause BullMQ to retry the job according to your queue's settings
    throw error;
  }
};

export default emailProcessor;
