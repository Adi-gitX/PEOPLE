import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const FRONTEND_URL = env.FRONTEND_URL.split(',').map((item) => item.trim()).filter(Boolean)[0] || 'http://localhost:5173';
const NODE_ENV = env.NODE_ENV || 'development';

const hasSmtpConfig = (): boolean => {
    return Boolean(
        env.SMTP_HOST
        && env.SMTP_USER
        && env.SMTP_PASS
        && env.SMTP_FROM_EMAIL
    );
};

const smtpFrom = (): string => {
    if (!env.SMTP_FROM_EMAIL) {
        return 'PEOPLE <no-reply@localhost>';
    }
    return `${env.SMTP_FROM_NAME} <${env.SMTP_FROM_EMAIL}>`;
};

let cachedTransporter: nodemailer.Transporter | null = null;
let missingSmtpWarned = false;

const getTransporter = (): nodemailer.Transporter | null => {
    if (!hasSmtpConfig()) {
        return null;
    }

    if (cachedTransporter) {
        return cachedTransporter;
    }

    cachedTransporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        pool: true,
        maxConnections: 5,
        maxMessages: 200,
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
        },
    });

    return cachedTransporter;
};

export interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
    provider?: 'smtp' | 'dev';
}

interface SendEmailOptions {
    text?: string;
    replyTo?: string;
}

const stripHtml = (value: string): string => {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const createEmailTemplate = (content: string): string => `
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
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, #0a0a0a 0%, #000000 100%); border: 1px solid #27272a; border-radius: 24px; overflow: hidden;">
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #0ea5e9 0%, #22c55e 50%, #f59e0b 100%);"></td>
          </tr>
          <tr>
            <td align="center" style="padding: 32px 40px 16px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">PEOPLE</h1>
              <p style="margin: 8px 0 0; color: #71717a; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;">Support</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, #27272a 50%, transparent 100%);"></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 28px;">
              <div style="height: 1px; background: #27272a; margin-bottom: 16px;"></div>
              <p style="margin: 0; color: #52525b; font-size: 12px; text-align: center; line-height: 1.5;">
                PEOPLE support system
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

export const isSupportEmailConfigured = (): boolean => {
    return Boolean(hasSmtpConfig() && env.SUPPORT_INBOX_EMAIL);
};

export const verifySmtpTransport = async (): Promise<{ ok: boolean; detail: string }> => {
    const transporter = getTransporter();

    if (!transporter) {
        return {
            ok: false,
            detail: 'SMTP config missing (host/user/pass/from)',
        };
    }

    try {
        await transporter.verify();
        return {
            ok: true,
            detail: `SMTP ${env.SMTP_HOST}:${env.SMTP_PORT} verified`,
        };
    } catch (error) {
        return {
            ok: false,
            detail: error instanceof Error ? error.message : 'SMTP verify failed',
        };
    }
};

export const sendEmail = async (
    to: string,
    subject: string,
    html: string,
    options: SendEmailOptions = {}
): Promise<SendResult> => {
    const transporter = getTransporter();

    if (!transporter) {
        if (NODE_ENV !== 'production') {
            if (!missingSmtpWarned) {
                missingSmtpWarned = true;
                console.warn('[EMAIL][WARN] SMTP is not configured. Email sends are mocked in non-production mode.');
            }
            return {
                success: true,
                provider: 'dev',
                messageId: `dev-${Date.now()}`,
            };
        }

        return {
            success: false,
            error: 'SMTP not configured',
        };
    }

    try {
        const info = await transporter.sendMail({
            from: smtpFrom(),
            to,
            subject,
            html,
            text: options.text || stripHtml(html),
            replyTo: options.replyTo || env.SUPPORT_REPLY_TO || undefined,
        });

        return {
            success: true,
            messageId: info.messageId,
            provider: 'smtp',
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'SMTP send failed',
            provider: 'smtp',
        };
    }
};

export const sendOtpEmail = async (email: string, otp: string): Promise<SendResult> => {
    const content = `
        <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center;">
          Your Verification Code
        </h2>
        <p style="margin: 0 0 20px; color: #a1a1aa; font-size: 15px; line-height: 1.6; text-align: center;">
          Enter this code to sign in:
        </p>
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; padding: 14px 28px; background: #18181b; border: 1px solid #3f3f46; border-radius: 12px; color: #ffffff; font-size: 28px; letter-spacing: 8px; font-family: monospace;">
            ${otp}
          </span>
        </div>
        <p style="margin: 0; color: #71717a; font-size: 13px; text-align: center;">Code expires in 10 minutes.</p>
    `;

    return sendEmail(email, 'Your PEOPLE verification code', createEmailTemplate(content));
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
    const content = `
        <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center;">
          Welcome, ${name}
        </h2>
        <p style="margin: 0 0 24px; color: #a1a1aa; font-size: 15px; line-height: 1.6; text-align: center;">
          Your PEOPLE account is ready.
        </p>
        <div style="text-align: center;">
          <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; padding: 14px 24px; background: #ffffff; color: #000000; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px;">
            Open Dashboard
          </a>
        </div>
    `;

    const result = await sendEmail(email, 'Welcome to PEOPLE', createEmailTemplate(content));
    return result.success;
};

export const sendApplicationNotification = async (
    initiatorEmail: string,
    missionTitle: string,
    applicantName: string
): Promise<boolean> => {
    const content = `
        <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center;">
          New Mission Application
        </h2>
        <p style="margin: 0 0 8px; color: #a1a1aa; font-size: 15px; text-align: center;">
          <strong style="color: #ffffff;">${applicantName}</strong> applied to:
        </p>
        <p style="margin: 0 0 24px; color: #ffffff; font-size: 15px; text-align: center;">${missionTitle}</p>
        <div style="text-align: center;">
          <a href="${FRONTEND_URL}/dashboard/initiator" style="display: inline-block; padding: 14px 24px; background: #ffffff; color: #000000; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px;">
            Review Applications
          </a>
        </div>
    `;

    const result = await sendEmail(
        initiatorEmail,
        `New application: ${missionTitle}`,
        createEmailTemplate(content)
    );
    return result.success;
};

interface SupportInboxTemplateInput {
    ticketRef: string;
    requesterName: string;
    requesterEmail: string;
    subject: string;
    message: string;
    category: string;
    priority: string;
}

interface SupportAckTemplateInput {
    ticketRef: string;
    requesterName: string;
    subject: string;
    message: string;
}

interface SupportReplyTemplateInput {
    ticketRef: string;
    requesterName: string;
    originalSubject: string;
    message: string;
}

export const createSupportInboxNotificationEmail = (input: SupportInboxTemplateInput): { subject: string; html: string; text: string } => {
    const subject = `[${input.ticketRef}] ${input.subject}`;
    const html = createEmailTemplate(`
        <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 22px; font-weight: 600;">
          New Support Ticket ${input.ticketRef}
        </h2>
        <p style="margin: 0 0 8px; color: #a1a1aa; font-size: 14px;"><strong style="color: #ffffff;">From:</strong> ${input.requesterName} (${input.requesterEmail})</p>
        <p style="margin: 0 0 8px; color: #a1a1aa; font-size: 14px;"><strong style="color: #ffffff;">Category:</strong> ${input.category}</p>
        <p style="margin: 0 0 16px; color: #a1a1aa; font-size: 14px;"><strong style="color: #ffffff;">Priority:</strong> ${input.priority}</p>
        <div style="background: #111111; border: 1px solid #27272a; border-radius: 10px; padding: 12px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Subject</p>
          <p style="margin: 0; color: #ffffff; font-size: 15px;">${input.subject}</p>
        </div>
        <div style="background: #111111; border: 1px solid #27272a; border-radius: 10px; padding: 12px;">
          <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Message</p>
          <p style="margin: 0; color: #e4e4e7; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${input.message}</p>
        </div>
    `);

    const text = [
        `New Support Ticket ${input.ticketRef}`,
        `From: ${input.requesterName} (${input.requesterEmail})`,
        `Category: ${input.category}`,
        `Priority: ${input.priority}`,
        `Subject: ${input.subject}`,
        '',
        input.message,
    ].join('\n');

    return { subject, html, text };
};

export const createSupportAcknowledgementEmail = (input: SupportAckTemplateInput): { subject: string; html: string; text: string } => {
    const subject = `We received your request (${input.ticketRef})`;
    const html = createEmailTemplate(`
        <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 22px; font-weight: 600; text-align: center;">
          Support Request Received
        </h2>
        <p style="margin: 0 0 12px; color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center;">
          Hi ${input.requesterName}, we created ticket <strong style="color: #ffffff;">${input.ticketRef}</strong>.
        </p>
        <p style="margin: 0 0 16px; color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center;">
          A support specialist will follow up as soon as possible.
        </p>
        <div style="background: #111111; border: 1px solid #27272a; border-radius: 10px; padding: 12px; margin-bottom: 10px;">
          <p style="margin: 0 0 6px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Subject</p>
          <p style="margin: 0; color: #ffffff; font-size: 14px;">${input.subject}</p>
        </div>
        <div style="background: #111111; border: 1px solid #27272a; border-radius: 10px; padding: 12px;">
          <p style="margin: 0 0 6px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Message</p>
          <p style="margin: 0; color: #e4e4e7; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${input.message}</p>
        </div>
    `);

    const text = [
        `Support Request Received`,
        `Ticket: ${input.ticketRef}`,
        `Subject: ${input.subject}`,
        '',
        `Hi ${input.requesterName},`,
        'We have received your support request and will reply shortly.',
        '',
        'Your message:',
        input.message,
    ].join('\n');

    return { subject, html, text };
};

export const createSupportReplyEmail = (input: SupportReplyTemplateInput): { subject: string; html: string; text: string } => {
    const subject = `Reply for ${input.ticketRef}: ${input.originalSubject}`;
    const html = createEmailTemplate(`
        <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 22px; font-weight: 600;">
          Support Update (${input.ticketRef})
        </h2>
        <p style="margin: 0 0 12px; color: #a1a1aa; font-size: 14px; line-height: 1.6;">
          Hi ${input.requesterName},
        </p>
        <p style="margin: 0 0 16px; color: #a1a1aa; font-size: 14px; line-height: 1.6;">
          Our support team replied to your request:
        </p>
        <div style="background: #111111; border: 1px solid #27272a; border-radius: 10px; padding: 12px;">
          <p style="margin: 0; color: #e4e4e7; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${input.message}</p>
        </div>
    `);

    const text = [
        `Support Update (${input.ticketRef})`,
        `Subject: ${input.originalSubject}`,
        '',
        `Hi ${input.requesterName},`,
        '',
        input.message,
    ].join('\n');

    return { subject, html, text };
};

export const sendContactFormEmail = async (
    fromEmail: string,
    fromName: string,
    subject: string,
    message: string
): Promise<boolean> => {
    const inbox = env.SUPPORT_INBOX_EMAIL || env.SMTP_FROM_EMAIL;
    if (!inbox) {
        return false;
    }

    const template = createSupportInboxNotificationEmail({
        ticketRef: 'CONTACT',
        requesterName: fromName,
        requesterEmail: fromEmail,
        subject,
        message,
        category: 'general',
        priority: 'normal',
    });

    const result = await sendEmail(inbox, template.subject, template.html, {
        text: template.text,
        replyTo: fromEmail,
    });

    return result.success;
};
