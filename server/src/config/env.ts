import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const booleanLikeSchema = z.preprocess((value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return value;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return value;
}, z.boolean());

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('5001'),
    FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    GMAIL_USER: z.string().optional(),
    GMAIL_APP_PASSWORD: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: booleanLikeSchema.default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM_EMAIL: z.string().email().optional(),
    SMTP_FROM_NAME: z.string().min(1).default('PEOPLE Support'),
    SUPPORT_INBOX_EMAIL: z.string().email().optional(),
    SUPPORT_REPLY_TO: z.string().email().optional(),
    SUPPORT_OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
    SUPPORT_OUTBOX_BASE_DELAY_MS: z.coerce.number().int().min(1000).default(30000),
    ADMIN_MESSAGES_ENABLED: booleanLikeSchema.default(true),
    ADMIN_PAYMENTS_CONSOLE_ENABLED: booleanLikeSchema.default(true),
    ADMIN_AUDIT_ENABLED: booleanLikeSchema.default(true),
    ADMIN_REQUIRE_MFA: booleanLikeSchema.default(false),
    ADMIN_MFA_ENFORCEMENT_MODE: z.enum(['warn', 'enforce']).default('warn'),
    ADMIN_MFA_RESET_REQUIRE_REASON: booleanLikeSchema.default(true),
    GEMINI_API_KEY: z.string().optional(),
    FRONTEND_URL: z.string().min(1).refine((value) => {
        const origins = value.split(',').map((origin) => origin.trim()).filter(Boolean);
        if (origins.length === 0) return false;
        return origins.every((origin) => {
            try {
                new URL(origin);
                return true;
            } catch {
                return false;
            }
        });
    }, 'FRONTEND_URL must be a valid URL or comma-separated list of valid URLs').default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
