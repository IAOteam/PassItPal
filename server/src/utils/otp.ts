import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error("Twilio credentials are not fully set in .env. OTP functionality might not work.");
}

const client = twilio(accountSid, authToken);

export const sendOtp = async (to: string, otp: string): Promise<boolean> => {
  try {
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error("Cannot send OTP: Twilio credentials missing.");
      return false;
    }

    // Twilio phone numbers are typically E.164 format (e.g., +1234567890)
    // Ensure the `to` number is also in E.164 format.
    // For local testing, you might need to adjust or mock this.
    const formattedTo = to.startsWith('+') ? to : `+91${to}`; // Assuming Indian numbers if no prefix, adjust as needed

    await client.messages.create({
      body: `Your PassitPal verification code is ${otp}.`,
      from: twilioPhoneNumber,
      to: formattedTo
    });
    console.log(`OTP sent to ${formattedTo}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
};

// In a real application, you'd also want to store OTPs temporarily in your database
// with an expiry, and then verify them. For now, we'll keep it simple.