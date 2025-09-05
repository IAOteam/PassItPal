const APP_NAME = "Passitpal";
const APP_URL = process.env.CLIENT_URL || 'https://passitpal.com';
const LOGO_URL = '/frontend/public/logo1.png'; // It's better to use a full CDN URL in production

export const createEmailLayout = (title: string, preheader: string, content: string): string => {
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
