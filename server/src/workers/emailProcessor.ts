import { Job } from 'bullmq';
import { sendEmail } from '../utils/emailService';
import User from '../models/User';

// Define the structure of the data we expect in our email jobs
interface EmailJobData {
  recipientId: string;
  senderName: string;
  messageText: string;
}

const emailProcessor = async (job: Job<EmailJobData>) => {
  const { recipientId, senderName, messageText } = job.data;
  
  try {
    console.log(`[Worker] Processing job ${job.id} for recipient ${recipientId}`);
    
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      throw new Error(`Recipient with ID ${recipientId} not found.`);
    }

    if (!recipient.email) {
      throw new Error(`Recipient ${recipientId} does not have an email address.`);
    }

    // Construct the email content
    const subject = `You have a new message from ${senderName} on Passitpal`;
    const text = `Hi ${recipient.username || 'there'},\n\nYou have a new message from ${senderName}:\n\n"${messageText.substring(0, 100)}..."\n\nPlease log in to view the full message.\n\nThanks,\nThe Passitpal Team`;
    const html = `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>Hi ${recipient.username || 'there'},</h2>
        <p>You have a new message from <strong>${senderName}</strong> on Passitpal.</p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 1rem; margin-left: 0; color: #555;">
          <p>"${messageText.substring(0, 100)}..."</p>
        </blockquote>
        <p>Please log in to your account to view the full conversation.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/messages" style="background-color: #2563eb; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Your Messages
        </a>
      </div>
    `;

    // Send the email
    await sendEmail(recipient.email, subject, text, html);

    console.log(`[Worker] Successfully sent email for job ${job.id} to ${recipient.email}`);
  } catch (error: any) {
    console.error(`[Worker] Error processing job ${job.id}:`, error.message);
    // Throwing the error here will cause BullMQ to retry the job according to your queue's settings
    throw error;
  }
};

export default emailProcessor;
