import { db, env } from '../config/index.js';
import { isSupportEmailConfigured, verifySmtpTransport } from '../services/email.js';

type CheckResult = {
    label: string;
    ok: boolean;
    detail: string;
};

const REQUIRED_KEYS = ['FIREBASE_PROJECT_ID', 'FRONTEND_URL'] as const;
const OPTIONAL_KEYS = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD',
] as const;

const parseOrigins = (value: string): string[] => {
    return value.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const checkOrigins = (origins: string[]): CheckResult => {
    const invalid = origins.filter((origin) => {
        try {
            new URL(origin);
            return false;
        } catch {
            return true;
        }
    });

    if (invalid.length > 0) {
        return {
            label: 'CORS allowlist',
            ok: false,
            detail: `Invalid origins: ${invalid.join(', ')}`,
        };
    }

    return {
        label: 'CORS allowlist',
        ok: true,
        detail: `${origins.length} origin(s) configured`,
    };
};

const checkFirebase = async (): Promise<CheckResult> => {
    try {
        await db.collection('_startupChecks').limit(1).get();
        return {
            label: 'Firebase Admin',
            ok: true,
            detail: 'Firestore connectivity OK',
        };
    } catch (error) {
        return {
            label: 'Firebase Admin',
            ok: false,
            detail: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

const render = (result: CheckResult): void => {
    const marker = result.ok ? 'OK' : 'FAIL';
    console.log(`[SERVER][${marker}] ${result.label}: ${result.detail}`);
};

export const runSystemCheck = async (context: { mode: 'preflight' | 'runtime'; port?: number }): Promise<boolean> => {
    console.log(`[SERVER] Running system check (${context.mode})...`);

    const results: CheckResult[] = [];
    const productionMode = env.NODE_ENV === 'production';

    REQUIRED_KEYS.forEach((key) => {
        const hasValue = Boolean(env[key]);
        results.push({
            label: `ENV ${key}`,
            ok: hasValue,
            detail: hasValue ? 'configured' : 'missing',
        });
    });

    OPTIONAL_KEYS.forEach((key) => {
        const hasValue = Boolean(env[key]);
        results.push({
            label: `ENV ${key}`,
            ok: true,
            detail: hasValue ? 'configured' : 'not set (optional)',
        });
    });

    const supportEnvChecks: Array<{ label: string; value: unknown }> = [
        { label: 'ENV SMTP_HOST', value: env.SMTP_HOST },
        { label: 'ENV SMTP_USER', value: env.SMTP_USER },
        { label: 'ENV SMTP_PASS', value: env.SMTP_PASS },
        { label: 'ENV SMTP_FROM_EMAIL', value: env.SMTP_FROM_EMAIL },
        { label: 'ENV SUPPORT_INBOX_EMAIL', value: env.SUPPORT_INBOX_EMAIL },
    ];

    supportEnvChecks.forEach((entry) => {
        const configured = Boolean(entry.value);
        results.push({
            label: entry.label,
            ok: productionMode ? configured : true,
            detail: configured
                ? 'configured'
                : productionMode
                    ? 'missing (required in production)'
                    : 'not set (optional in non-production)',
        });
    });

    const origins = parseOrigins(env.FRONTEND_URL);
    results.push(checkOrigins(origins));
    results.push(await checkFirebase());

    if (isSupportEmailConfigured()) {
        const smtpCheck = await verifySmtpTransport();
        results.push({
            label: 'Support SMTP',
            ok: smtpCheck.ok,
            detail: smtpCheck.detail,
        });
    } else {
        results.push({
            label: 'Support SMTP',
            ok: !productionMode,
            detail: productionMode
                ? 'not ready (missing SMTP/support inbox config)'
                : 'not configured (development mode)',
        });
    }

    if (context.port) {
        results.push({
            label: 'HTTP Port',
            ok: true,
            detail: String(context.port),
        });
    }

    results.forEach(render);

    const allOk = results.every((result) => result.ok);
    console.log(
        `[SERVER] ${allOk ? 'All systems connected and healthy.' : 'System check found issues.'}`
    );

    return allOk;
};
