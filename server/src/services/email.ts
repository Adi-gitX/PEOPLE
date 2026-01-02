import { Resend } from 'resend';
import { env } from '../config/index.js';

// Initialize Resend client
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Email from address - use verified domain in production
// NOTE: You must verify your domain in Resend Dashboard before using a custom domain
// Until verified, use 'onboarding@resend.dev' (only sends to your Resend account email)
const FROM_EMAIL = env.NODE_ENV === 'production'
    ? 'PEOPLE <noreply@peoplemissions.vercel.app>'  // Change this after domain verification
    : 'PEOPLE <onboarding@resend.dev>';

export type EmailType =
    | 'welcome'
    | 'application_received'
    | 'application_accepted'
    | 'application_rejected'
    | 'mission_completed'
    | 'payment_received'
    | 'password_reset'
    | 'contact_form'
    | 'otp';

interface EmailOptions {
    to: string;
    subject: string;
    templateId?: EmailType;
    data?: Record<string, unknown>;
    html?: string;
}

interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<SendResult> => {
    try {
        // If Resend is not configured, log and return success (dev mode)
        if (!resend) {
            console.log('📧 [DEV MODE] Email would be sent:', {
                to: options.to,
                subject: options.subject,
            });
            console.log('📧 [DEV MODE] To enable real emails, add RESEND_API_KEY to .env');
            return { success: true, messageId: `dev-${Date.now()}` };
        }

        // Send email using Resend
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: options.to,
            subject: options.subject,
            html: options.html || generateDefaultHtml(options.subject),
        });

        if (error) {
            console.error('📧 Resend error:', error);
            return { success: false, error: error.message };
        }

        console.log('📧 Email sent successfully:', data?.id);
        return { success: true, messageId: data?.id };
    } catch (error: any) {
        console.error('📧 Email send error:', error);
        return { success: false, error: error.message };
    }
};

// Generate default HTML wrapper
const generateDefaultHtml = (title: string): string => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px; color: #000;">${title}</h1>
    </div>
`;

// Helper functions for common email types
export const sendOtpEmail = async (email: string, otp: string): Promise<SendResult> => {
    return sendEmail({
        to: email,
        subject: 'Your PEOPLE Verification Code',
        templateId: 'otp',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="font-size: 24px; font-weight: bold; color: #000; margin: 0;">PEOPLE</h1>
                </div>
                <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #000;">Your Verification Code</h2>
                <p style="color: #666; margin-bottom: 24px; font-size: 16px;">Enter this code to sign in to your account:</p>
                <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #000;">${otp}</span>
                </div>
                <p style="color: #999; font-size: 14px; margin-bottom: 8px;">This code expires in 10 minutes.</p>
                <p style="color: #999; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
                <p style="color: #999; font-size: 12px; text-align: center;">PEOPLE - The Talent Matching Platform</p>
            </div>
        `,
    });
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
    const result = await sendEmail({
        to: email,
        subject: 'Welcome to PEOPLE!',
        templateId: 'welcome',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px; color: #000;">Welcome to PEOPLE, ${name}!</h1>
                <p style="color: #666; margin-bottom: 24px;">Your account has been created successfully. You can now start exploring missions and connecting with talent.</p>
                <a href="${env.FRONTEND_URL}/dashboard" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to Dashboard</a>
            </div>
        `,
    });
    return result.success;
};

export const sendApplicationNotification = async (
    initiatorEmail: string,
    missionTitle: string,
    applicantName: string
): Promise<boolean> => {
    const result = await sendEmail({
        to: initiatorEmail,
        subject: `New Application: ${missionTitle}`,
        templateId: 'application_received',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px; color: #000;">New Application Received</h1>
                <p style="color: #666; margin-bottom: 16px;"><strong>${applicantName}</strong> has applied for your mission:</p>
                <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                    <p style="margin: 0; font-weight: 600; color: #000;">${missionTitle}</p>
                </div>
                <a href="${env.FRONTEND_URL}/dashboard/initiator" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Review Application</a>
            </div>
        `,
    });
    return result.success;
};

export const sendContactFormEmail = async (
    fromEmail: string,
    fromName: string,
    subject: string,
    message: string
): Promise<boolean> => {
    // Send to admin email (fallback to a default)
    const adminEmail = 'delivered@resend.dev'; // Use Resend's test email for now

    const result = await sendEmail({
        to: adminEmail,
        subject: `Contact Form: ${subject}`,
        templateId: 'contact_form',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px; color: #000;">Contact Form Submission</h1>
                <p style="color: #666; margin-bottom: 8px;"><strong>From:</strong> ${fromName} (${fromEmail})</p>
                <p style="color: #666; margin-bottom: 16px;"><strong>Subject:</strong> ${subject}</p>
                <div style="background: #f5f5f5; padding: 16px; border-radius: 8px;">
                    <p style="margin: 0; color: #333; white-space: pre-wrap;">${message}</p>
                </div>
            </div>
        `,
    });
    return result.success;
};
