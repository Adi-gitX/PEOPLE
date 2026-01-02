import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import dotenv from 'dotenv';

// Reload env to ensure we have latest values
dotenv.config();

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Resend client
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Create Gmail transporter as fallback
const createGmailTransporter = () => {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.log('📧 Gmail credentials not found. GMAIL_USER:', !!GMAIL_USER, 'GMAIL_APP_PASSWORD:', !!GMAIL_APP_PASSWORD);
    return null;
  }
  console.log('📧 Gmail SMTP configured for:', GMAIL_USER);
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
};

const gmailTransporter = createGmailTransporter();

// Log provider status on startup
console.log('═══════════════════════════════════════════════════════════');
console.log('  📧 EMAIL PROVIDERS CONFIGURED');
console.log('═══════════════════════════════════════════════════════════');
console.log(`  Resend (Primary):   ${resend ? '✅ Ready' : '❌ No API key'}`);
console.log(`  Gmail (Fallback):   ${gmailTransporter ? '✅ Ready' : '❌ No credentials'}`);
console.log('═══════════════════════════════════════════════════════════');

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: 'resend' | 'gmail' | 'dev';
}

// Beautiful dark-themed email template
const createEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, #0a0a0a 0%, #000000 100%); border: 1px solid #27272a; border-radius: 24px; overflow: hidden;">
          
          <!-- Header with Gradient Accent -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #f97316 100%);"></td>
          </tr>
          
          <!-- Logo Section -->
          <tr>
            <td align="center" style="padding: 48px 40px 24px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px; color: #ffffff;">PEOPLE</h1>
              <p style="margin: 8px 0 0; color: #71717a; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">The Future of Work</p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, #27272a 50%, transparent 100%);"></div>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="height: 1px; background: #27272a; margin-bottom: 24px;"></div>
              <p style="margin: 0; color: #52525b; font-size: 12px; text-align: center; line-height: 1.6;">
                © 2026 PEOPLE. All rights reserved.<br>
                Building the future of collaborative work.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
`;

// Send email via Resend
const sendViaResend = async (
  to: string,
  subject: string,
  html: string
): Promise<SendResult> => {
  if (!resend) {
    return { success: false, error: 'Resend not configured' };
  }

  try {
    // Use verified domain in production, or onboarding@resend.dev for testing
    const fromEmail = NODE_ENV === 'production'
      ? `PEOPLE <noreply@${process.env.RESEND_DOMAIN || 'resend.dev'}>`
      : 'PEOPLE <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('📧 Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('📧 ✅ Sent via Resend to:', to, 'ID:', data?.id);
    return { success: true, messageId: data?.id, provider: 'resend' };
  } catch (error: any) {
    console.error('📧 Resend exception:', error.message);
    return { success: false, error: error.message };
  }
};

// Send email via Gmail SMTP
const sendViaGmail = async (
  to: string,
  subject: string,
  html: string
): Promise<SendResult> => {
  if (!gmailTransporter) {
    return { success: false, error: 'Gmail not configured' };
  }

  try {
    const mailOptions = {
      from: `"PEOPLE" <${GMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await gmailTransporter.sendMail(mailOptions);
    console.log('📧 ✅ Sent via Gmail to:', to, 'ID:', info.messageId);
    return { success: true, messageId: info.messageId, provider: 'gmail' };
  } catch (error: any) {
    console.error('📧 Gmail error:', error.message);
    return { success: false, error: error.message };
  }
};

// Main send email function with fallback
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<SendResult> => {
  // Try Resend first
  if (resend) {
    const resendResult = await sendViaResend(to, subject, html);
    if (resendResult.success) {
      return resendResult;
    }
    console.log('📧 Resend failed, falling back to Gmail...');
  }

  // Fallback to Gmail
  if (gmailTransporter) {
    const gmailResult = await sendViaGmail(to, subject, html);
    if (gmailResult.success) {
      return gmailResult;
    }
  }

  // Dev mode fallback
  if (NODE_ENV === 'development') {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  📧 EMAIL (DEV MODE - No provider available)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log('  Add RESEND_API_KEY or GMAIL credentials to .env');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    return { success: true, messageId: `dev-${Date.now()}`, provider: 'dev' };
  }

  return { success: false, error: 'No email provider available' };
};

// OTP Email Template
export const sendOtpEmail = async (email: string, otp: string): Promise<SendResult> => {
  // Always log OTP in development
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🔐 OTP VERIFICATION CODE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Email: ${email}`);
  console.log(`  Code:  ${otp}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const content = `
        <!-- Icon -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border: 1px solid #3f3f46; border-radius: 16px; display: inline-block; line-height: 64px; font-size: 28px; text-align: center;">
                🔐
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Heading -->
        <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center; line-height: 1.3;">
          Your Verification Code
        </h2>
        
        <!-- Description -->
        <p style="margin: 0 0 24px; color: #a1a1aa; font-size: 15px; line-height: 1.7; text-align: center;">
          Enter this code to sign in to your PEOPLE account:
        </p>
        
        <!-- OTP Code Box -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #18181b 0%, #0a0a0a 100%); border: 2px solid #3f3f46; border-radius: 16px;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #ffffff; font-family: 'SF Mono', 'Fira Code', monospace;">${otp}</span>
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Expiry Notice -->
        <p style="margin: 24px 0 0; color: #71717a; font-size: 14px; text-align: center;">
          This code expires in <strong style="color: #ffffff;">10 minutes</strong>
        </p>
        
        <!-- Security Notice -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; background: #18181b; border: 1px solid #27272a; border-radius: 12px;">
          <tr>
            <td style="padding: 16px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="24" valign="top" style="padding-right: 12px; font-size: 16px;">🔒</td>
                  <td>
                    <p style="margin: 0; color: #a1a1aa; font-size: 13px; line-height: 1.5;">
                      <strong style="color: #ffffff;">Security tip:</strong> Never share this code with anyone. PEOPLE will never ask for your verification code.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
    `;

  return sendEmail(email, '🔐 Your PEOPLE Verification Code', createEmailTemplate(content));
};

// Welcome Email Template  
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  const content = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border: 1px solid #3f3f46; border-radius: 16px; display: inline-block; line-height: 64px; font-size: 28px; text-align: center;">
                🎉
              </div>
            </td>
          </tr>
        </table>
        
        <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center;">
          Welcome to PEOPLE, ${name}!
        </h2>
        
        <p style="margin: 0 0 32px; color: #a1a1aa; font-size: 15px; line-height: 1.7; text-align: center;">
          Your account has been created successfully. You're now part of a community building the future of collaborative work.
        </p>
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; padding: 16px 48px; background: #ffffff; color: #000000; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px;">
                Go to Dashboard →
              </a>
            </td>
          </tr>
        </table>
    `;

  const result = await sendEmail(email, '🎉 Welcome to PEOPLE!', createEmailTemplate(content));
  return result.success;
};

// Application Notification Email
export const sendApplicationNotification = async (
  initiatorEmail: string,
  missionTitle: string,
  applicantName: string
): Promise<boolean> => {
  const content = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border: 1px solid #3f3f46; border-radius: 16px; display: inline-block; line-height: 64px; font-size: 28px; text-align: center;">
                📬
              </div>
            </td>
          </tr>
        </table>
        
        <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center;">
          New Application Received
        </h2>
        
        <p style="margin: 0 0 16px; color: #a1a1aa; font-size: 15px; line-height: 1.7; text-align: center;">
          <strong style="color: #ffffff;">${applicantName}</strong> has applied for your mission:
        </p>
        
        <div style="padding: 16px 20px; background: #18181b; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 32px;">
          <p style="margin: 0; color: #ffffff; font-size: 15px; font-weight: 600; text-align: center;">
            ${missionTitle}
          </p>
        </div>
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${FRONTEND_URL}/dashboard/initiator" style="display: inline-block; padding: 16px 48px; background: #ffffff; color: #000000; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px;">
                Review Application →
              </a>
            </td>
          </tr>
        </table>
    `;

  const result = await sendEmail(
    initiatorEmail,
    `📬 New Application: ${missionTitle}`,
    createEmailTemplate(content)
  );
  return result.success;
};

// Contact Form Email
export const sendContactFormEmail = async (
  fromEmail: string,
  fromName: string,
  subject: string,
  message: string
): Promise<boolean> => {
  const adminEmail = GMAIL_USER || 'admin@example.com';

  const content = `
        <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center;">
          Contact Form Submission
        </h2>
        
        <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; color: #71717a; font-size: 13px;">FROM</p>
          <p style="margin: 0; color: #ffffff; font-size: 15px;">${fromName} &lt;${fromEmail}&gt;</p>
        </div>
        
        <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; color: #71717a; font-size: 13px;">SUBJECT</p>
          <p style="margin: 0; color: #ffffff; font-size: 15px;">${subject}</p>
        </div>
        
        <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px;">
          <p style="margin: 0 0 8px; color: #71717a; font-size: 13px;">MESSAGE</p>
          <p style="margin: 0; color: #a1a1aa; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${message}</p>
        </div>
    `;

  const result = await sendEmail(
    adminEmail,
    `📩 Contact: ${subject}`,
    createEmailTemplate(content)
  );
  return result.success;
};
