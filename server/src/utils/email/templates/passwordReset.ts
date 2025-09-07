import { createEmailLayout } from '../layout';

const APP_NAME = "Passitpal";

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
