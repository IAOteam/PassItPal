// server/src/utils/emailTemplates.ts

const APP_NAME = "Passitpal";
const APP_URL = process.env.CLIENT_URL || 'https://passitpal.com';
// You should host your logo online (e.g., in Cloudinary) and put the URL here
const LOGO_URL = '/frontend/public/logo1.png'; // Replace with your actual logo URL


/**
 * A reusable HTML layout for all emails.
 */
const createEmailLayout = (title: string, preheader: string, content: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        .container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background-color: #4338ca; padding: 20px; text-align: center; }
        .header img { max-width: 150px; }
        .content { padding: 30px; color: #334155; font-family: Arial, sans-serif; line-height: 1.6; font-size: 16px; }
        .content h1 { color: #4338ca; font-size: 24px; }
        .button { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        .preheader { display: none; max-height: 0; overflow: hidden; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9;">
      <span class="preheader">${preheader}</span>
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <div class="container">
              <div class="header">
                <a href="${APP_URL}" target="_blank">
                  <img src="${LOGO_URL}" alt="${APP_NAME} Logo">
                </a>
              </div>
              <div class="content">
                ${content}
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
                <p>You are receiving this email because of an action performed on our platform.</p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Generates the HTML content for a welcome email.
 */
export const getWelcomeEmailTemplate = (username: string): { subject: string; html: string } => {
    const subject = `Welcome to ${APP_NAME}!`;
    const preheader = `Your account is ready. Start buying and selling passes securely.`;
    const content = `
        <h1>Welcome aboard, ${username}!</h1>
        <p>We're thrilled to have you join the ${APP_NAME} community. You're now part of the best platform for securely buying and selling unused passes, tickets, and subscriptions.</p>
        <p>To get started, we recommend you verify your email address. This helps secure your account and builds trust within the community.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/verify-otp" target="_blank" class="button">Verify Your Email</a>
        </p>
        <p>Happy trading,<br>The ${APP_NAME} Team</p>
    `;
    return { subject, html: createEmailLayout(subject, preheader, content) };
};

/**
 * Generates the HTML content for a new message notification.
 */
export const getNewMessageNotificationTemplate = (recipientName: string, senderName: string, messagePreview: string): { subject: string; html: string } => {
    const subject = `You have a new message from ${senderName}`;
    const preheader = `"${messagePreview}..."`;
    const content = `
        <h1>New Message from ${senderName}</h1>
        <p>Hi ${recipientName},</p>
        <p>You've received a new message on ${APP_NAME}:</p>
        <p style="background-color: #f8fafc; border-left: 4px solid #cbd5e1; padding: 15px; margin: 20px 0;">
            <em>"${messagePreview}..."</em>
        </p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/messages" target="_blank" class="button">View Conversation</a>
        </p>
    `;
    return { subject, html: createEmailLayout(subject, preheader, content) };
};

/**
 * Generates the HTML content for a password reset email.
 */
export const getPasswordResetTemplate = (username: string, otp: string): { subject: string; html: string } => {
    const subject = `Your Password Reset Code for ${APP_NAME}`;
    const preheader = `Here is your code to reset your password.`;
    const content = `
        <h1>Reset Your Password</h1>
        <p>Hi ${username},</p>
        <p>We received a request to reset your password. Use the One-Time Password (OTP) below to proceed. This code is valid for 10 minutes.</p>
        <p style="text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 30px 0; background-color: #f1f5f9; padding: 15px; border-radius: 5px;">
            ${otp}
        </p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
    `;
    return { subject, html: createEmailLayout(subject, preheader, content) };
};
