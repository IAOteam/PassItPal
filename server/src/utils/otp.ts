import User from '../models/User';
import { OTP_EXPIRY_MINUTES } from '../config/constants';
import { sendEmail } from './emailService'; 
import dotenv from 'dotenv';
dotenv.config(); 
import twilio from 'twilio';



// Initialize Twilio client
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // Twilio sending number

// --- DEBUG LOGGING for Twilio credentials ---
console.log(`[Twilio Setup] Account SID loaded: ${!!twilioAccountSid}`);
console.log(`[Twilio Setup] Auth Token loaded: ${!!twilioAuthToken}`);
console.log(`[Twilio Setup] Phone Number loaded: ${!!twilioPhoneNumber}`);


if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
  console.error("[Twilio Setup] CRITICAL ERROR: Twilio credentials are not fully set in environment variables! SMS sending will fail.");
  //  throw an error or handle this more better in production : Remember to do idiot
}

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

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
export const sendOtp = async (email: string, mobileNumber: string | undefined, type: 'email' | 'mobile',purpose: 'verification' | 'password_reset'): Promise<void> => {
console.log(`[sendOtp] START - Sending OTP for user: ${email}, type: ${type}, purpose: ${purpose}`);
  
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000); // OTP expiry time
console.log(`[sendOtp] Generated OTP: ${otp}, Expiry: ${otpExpiry.toISOString()}`);

  const user = await User.findOne({ email });

  if (!user) {
        console.error(`[sendOtp] ERROR: User not found for email: ${email}`);

    throw new Error('User not found.');
  }
    console.log(`[sendOtp] User found: ${user._id}`);


  user.otp = otp;
  user.otpExpiry = otpExpiry;
  user.otpPurpose = purpose;
    console.log(`[sendOtp] Attempting to save OTP to user document...`);

  await user.save();
  console.log(`[sendOtp] OTP saved to user document successfully.`);

  if (type === 'email') {
     try {
                console.log(`[sendOtp] Preparing to send email to ${email}...`);

    const emailSubject = 'Your PassItPal OTP for Email Verification';
    const emailText = `Your OTP for email verification is: ${otp}. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`;
    const emailHtml = `<p>Your OTP for email verification is: <strong>${otp}</strong>.</p><p>It is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>`;
    await sendEmail(email, emailSubject, emailText, emailHtml);
          console.log(`[sendOtp] Email sent successfully to ${email}.`);

    // console.log(`OTP ${otp} sent to ${email} for email verification.`);
     } catch (emailError: any) {
      
      console.error(`[sendOtp] CRITICAL ERROR sending email:`, emailError.message, emailError.stack);
      // Re-throw the error so the calling function knows it failed
      throw new Error('Failed to send email OTP.');
    }
  } else if (type === 'mobile') {
    
    if (!mobileNumber) {
            console.error(`[sendOtp] ERROR: Mobile number not provided for mobile OTP.`);

      throw new Error('Mobile number not provided for mobile OTP.');
    }
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        console.error(`[sendOtp] ERROR: Cannot send SMS because Twilio credentials are not configured.`);
        throw new Error('SMS service is not configured on the server.');
    }
  try {
      console.log(`[sendOtp] Preparing to send SMS via Twilio to ${mobileNumber}...`);
    const numberToSendTo = `+91${mobileNumber}`;
      console.log(`[sendOtp] Preparing to send SMS via Twilio from: ${twilioPhoneNumber} to formatted number: ${numberToSendTo}...`);
      
        const message = await twilioClient.messages.create({
            body: `Your PassItPal OTP is: ${otp} , It is valid for ${OTP_EXPIRY_MINUTES} minutes.`,
            from: twilioPhoneNumber, // Twilio phone number
            to: numberToSendTo // Recipient's phone number
        });
              console.log(`[sendOtp] SMS sent successfully via Twilio. Message SID: ${message.sid}`);

      //  await twilioService.sendSms(mobileNumber, `Your PassItPal OTP is: ${otp}`);
      // console.log(`OTP ${otp} sent to ${mobileNumber} for mobile verification (SMS gateway placeholder).`);
  } catch (twilioError: any) {
          console.error(`[sendOtp] CRITICAL ERROR sending SMS via Twilio to ${mobileNumber}:`, twilioError.message, twilioError.stack);

        // console.error(`Error sending SMS via Twilio to ${mobileNumber}:`, twilioError.message);
        throw new Error(`Failed to send mobile OTP via Twilio: ${twilioError.message}`);
    }
  }
    console.log(`[sendOtp] END - Process complete for user: ${email}`);

};

/**
 * Verifies the provided OTP for a user.
 * @param {string} email - User's email.
 * @param {string} otp - OTP to verify.
 * @param {'email' | 'mobile'} type - The type of verification.
 * @returns {Promise<boolean>} True if OTP is valid, false otherwise.
 */
export const verifyOtp = async (email: string, otp: string, type: 'email' | 'mobile',purpose: 'verification' | 'password_reset'): Promise<boolean> => {
   const user = await User.findOne({ email }).select('+otp +otpExpiry +otpPurpose');

  if (!user) {
    // console.log(`Verify OTP: User not found for email: ${email}`);
    throw new Error('User not found.');
  }
    //  console.log("------------------- DEBUG: USER OBJECT AFTER FIND -------------------");
    // // console.log(user);
    // console.log("---------------------------------------------------------------------");
    // console.log(`Verify OTP: User found: ${user.email}`);
    // console.log(`Verify OTP: DB OTP: ${user.otp}, Expiry: ${user.otpExpiry}, Purpose: ${user.otpPurpose}`);
    // console.log(`Verify OTP: Provided OTP: ${otp}, Type: ${type}, Purpose: ${purpose}`);

  if (!user.otp || user.otp !== otp) {
        // console.log(`Verify OTP: Mismatch - Stored OTP missing or does not match provided OTP.`);
        // Optionally clear OTP here for failed attempts
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpPurpose = undefined;
        await user.save();
        return false;
    }
    if (user.otpPurpose !== purpose) {
        // console.log(`Verify OTP: Purpose mismatch. Expected: ${purpose}, Found: ${user.otpPurpose}`);
        // Clear OTP if purpose is wrong to prevent misuse
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpPurpose = undefined;
        await user.save();
        return false;
    }
  if (!user.otpExpiry || user.otpExpiry < new Date()) {
        // console.log(`Verify OTP: OTP expired or expiry date missing. Expiry: ${user.otpExpiry}, Current: ${new Date()}`);
        // Clear expired OTP
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpPurpose = undefined;
        await user.save();
        return false;
    }
   console.log(`Verify OTP: All conditions passed. OTP is valid.`);

  // Clear OTP fields after successful verification
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.otpPurpose = undefined;
  user.otpVerifiedAt = new Date(); // Set verification timestamp

  if (type === 'email') {
    user.isEmailVerified = true;
  } else if (type === 'mobile') {
    user.isMobileVerified = true;
  }

  await user.save();
  // console.log(`Verify OTP: OTP successfully verified for ${user.email}.`);
  return true;
};