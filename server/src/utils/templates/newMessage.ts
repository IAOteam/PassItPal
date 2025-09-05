import { createEmailLayout } from "../email/layout";


const APP_NAME = "Passitpal";
const APP_URL = process.env.CLIENT_URL || 'https://passitpal.com';

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
