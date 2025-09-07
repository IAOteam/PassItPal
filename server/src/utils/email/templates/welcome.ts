import { createEmailLayout } from '../layout';

const APP_NAME = "Passitpal";
const APP_URL = process.env.CLIENT_URL || 'https://passitpal.com';

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
