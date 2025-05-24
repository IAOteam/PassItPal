import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter using environment variables
// For production, consider services like SendGrid, Mailgun, AWS SES, etc.
// Example for Gmail (less secure, good for dev):
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// Example for a generic SMTP server (recommended for production)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'), // Typically 587 for TLS, 465 for SSL
  secure: process.env.SMTP_SECURE === 'true', // Use 'true' for 465, 'false' for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production' // Set to true in production
  }
});


/**
 * Sends an email using Nodemailer.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} text - Plain text body of the email.
 * @param {string} html - HTML body of the email.
 */
export const sendEmail = async (to: string, subject: string, text: string, html: string): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM, // Your verified sender email address
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Error sending email:', error);
    // In a real application, you might want to log this error more robustly
    // and potentially retry or use a dead-letter queue.
    throw new Error('Failed to send email.');
  }
};