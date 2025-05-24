import User from '../models/User.model';
import { OTP_EXPIRY_MINUTES } from '../config/constants';
import { sendEmail } from './emailService'; // Will be created next

/**
 * Generates a 6-digit OTP.
 * @returns {string} The generated OTP.
 */
export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends an OTP to a user via email or SMS (placeholder for SMS).
 * @param {string} email - User's email.
 * @param {string} mobileNumber - User's mobile number (optional, for SMS).
 * @param {'email' | 'mobile'} type - The type of verification (email or mobile).
 * @returns {Promise<void>}
 */
export const sendOtp = async (email: string, mobileNumber: string | undefined, type: 'email' | 'mobile'): Promise<void> => {
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000); // OTP expiry time

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('User not found.');
  }

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  if (type === 'email') {
    const emailSubject = 'Your PassItPal OTP for Email Verification';
    const emailText = `Your OTP for email verification is: ${otp}. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`;
    const emailHtml = `<p>Your OTP for email verification is: <strong>${otp}</strong>.</p><p>It is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>`;
    await sendEmail(email, emailSubject, emailText, emailHtml);
    console.log(`OTP ${otp} sent to ${email} for email verification.`);
  } else if (type === 'mobile') {
    if (!mobileNumber) {
      throw new Error('Mobile number not provided for mobile OTP.');
    }
    // TODO: Integrate with an SMS gateway like Twilio here
    // Example: await twilioService.sendSms(mobileNumber, `Your PassItPal OTP is: ${otp}`);
    console.log(`OTP ${otp} sent to ${mobileNumber} for mobile verification (SMS gateway placeholder).`);
  }
};

/**
 * Verifies the provided OTP for a user.
 * @param {string} email - User's email.
 * @param {string} otp - OTP to verify.
 * @param {'email' | 'mobile'} type - The type of verification.
 * @returns {Promise<boolean>} True if OTP is valid, false otherwise.
 */
export const verifyOtp = async (email: string, otp: string, type: 'email' | 'mobile'): Promise<boolean> => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('User not found.');
  }

  if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
    return false; // OTP is invalid or expired
  }

  // Clear OTP fields after successful verification
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.otpVerifiedAt = new Date(); // Set verification timestamp

  if (type === 'email') {
    user.isEmailVerified = true;
  } else if (type === 'mobile') {
    user.isMobileVerified = true;
  }

  await user.save();
  return true;
};