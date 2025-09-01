import User from '../models/User';
import { OTP_EXPIRY_MINUTES } from '../config/constants';
import { sendEmail } from './emailService';
import dotenv from 'dotenv';
import twilio from 'twilio';
import { getWelcomeEmailTemplate } from './emailTemplates';
import { HttpError } from '../services/auth.service'; // Use HttpError for consistent error handling

dotenv.config();

// --- Twilio Setup ---
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
  console.error(
    '[Twilio Setup] CRITICAL ERROR: Twilio credentials are not fully set in environment variables! SMS sending will fail.'
  );
}

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

/**
 * Generates a 6-digit OTP.
 */
export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends an OTP via email or SMS.
 */
export const sendOtp = async (
  email: string,
  mobileNumber: string | undefined,
  type: 'email' | 'mobile',
  purpose: 'verification' | 'password_reset'
): Promise<void> => {
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const user = await User.findOne({ email });
  if (!user) throw new HttpError('User not found.', 404);

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  user.otpPurpose = purpose;
  await user.save();

  if (type === 'email') {
    try {
      const subject = 'Your PassItPal OTP for Email Verification';
      const text = `Your OTP is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;
      const html = `<p>Your OTP is: <strong>${otp}</strong>.</p><p>Valid for ${OTP_EXPIRY_MINUTES} minutes.</p>`;
      await sendEmail(email, subject, text, html);
    } catch (err: any) {
      console.error('[sendOtp] ERROR sending email:', err.message);
      throw new HttpError('Failed to send email OTP.', 500);
    }
  } else if (type === 'mobile') {
    if (!mobileNumber) throw new HttpError('Mobile number required for OTP.', 400);
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new HttpError('SMS service not configured.', 500);
    }
    try {
      await twilioClient.messages.create({
        body: `Your PassItPal OTP is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
        from: twilioPhoneNumber,
        to: `+91${mobileNumber}`,
      });
    } catch (err: any) {
      console.error('[sendOtp] ERROR sending SMS:', err.message);
      throw new HttpError(`Failed to send SMS OTP: ${err.message}`, 500);
    }
  }
};

/**
 * Verifies an OTP for a user.
 */
export const verifyOtp = async (
  email: string,
  otp: string,
  type: 'email' | 'mobile',
  purpose: 'verification' | 'password_reset'
): Promise<boolean> => {
  const user = await User.findOne({ email }).select('+otp +otpExpiry +otpPurpose');
  if (!user) throw new HttpError('User not found.', 404);

  // Check OTP validity
  if (!user.otp || user.otp !== otp || user.otpPurpose !== purpose || !user.otpExpiry || user.otpExpiry < new Date()) {
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpPurpose = undefined;
    await user.save();
    return false;
  }

  // Mark verification success
  if (type === 'email' && purpose === 'verification' && !user.isEmailVerified) {
    user.isEmailVerified = true;
    const { subject, html } = getWelcomeEmailTemplate(user.username);
    sendEmail(user.email, subject, '', html).catch((err) =>
      console.error('Failed to send welcome email:', err)
    );
  } else if (type === 'mobile') {
    user.isMobileVerified = true;
  }

  // Clear OTP fields + track verification timestamp
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.otpPurpose = undefined;
  user.otpVerifiedAt = new Date();

  await user.save();
  return true;
};
