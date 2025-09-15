import { Request, Response } from 'express';

/**
 * Debug endpoint to check OTP service configuration (admin only)
 */
export const checkOtpConfig = (req: Request, res: Response) => {
  const config = {
    twilio: {
      hasSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasPhone: !!process.env.TWILIO_PHONE_NUMBER,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER ? `${process.env.TWILIO_PHONE_NUMBER?.slice(0, 8)}***` : 'NOT_SET'
    },
    email: {
      hasSmtpHost: !!process.env.SMTP_HOST,
      hasSmtpUser: !!process.env.SMTP_USER,
      hasSmtpPass: !!process.env.SMTP_PASS,
      smtpHost: process.env.SMTP_HOST || 'NOT_SET'
    }
  };
  
  res.json({ 
    message: 'OTP Service Configuration',
    config,
    recommendations: {
      twilio: config.twilio.hasSid && config.twilio.hasToken && config.twilio.hasPhone 
        ? 'Twilio appears to be configured correctly' 
        : 'Twilio configuration is incomplete. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.',
      email: config.email.hasSmtpHost && config.email.hasSmtpUser && config.email.hasSmtpPass
        ? 'Email service appears to be configured correctly'
        : 'Email configuration may be incomplete. Check SMTP environment variables.'
    }
  });
};

/**
 * Debug endpoint to check Google Maps API configuration (admin only)
 */
export const checkMapsConfig = (req: Request, res: Response) => {
  const config = {
    googleMaps: {
      hasApiKey: !!process.env.GOOGLE_MAPS_API_KEY,
      apiKey: process.env.GOOGLE_MAPS_API_KEY ? `${process.env.GOOGLE_MAPS_API_KEY?.slice(0, 8)}***` : 'NOT_SET'
    }
  };
  
  res.json({ 
    message: 'Google Maps API Configuration',
    config,
    recommendations: {
      googleMaps: config.googleMaps.hasApiKey
        ? 'Google Maps API key appears to be configured. Make sure it has Geocoding API enabled.'
        : 'Google Maps API key is missing. Set GOOGLE_MAPS_API_KEY environment variable and ensure it has Geocoding API enabled.',
      testing: 'To test geocoding, try making a request to /api/listings/reverse-geocode with latitude and longitude parameters.'
    }
  });
};
