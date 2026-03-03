import crypto from 'crypto';
import { db } from '../config/firebase.js';
import { sendOtpEmail } from './email.js';

const OTP_COLLECTION = 'authOtpChallenges';
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

export type OtpMode = 'login' | 'signup';

interface OtpContext {
    mode: OtpMode;
    ip?: string;
    userAgent?: string;
    locale?: string;
    fullName?: string;
    rolePreference?: 'contributor' | 'initiator';
    clientMeta?: Record<string, unknown> | undefined;
}

const normalizeEmail = (email: string): string => email.toLowerCase().trim();

const challengeDocIdFor = (email: string, mode: OtpMode): string => {
    const key = `${normalizeEmail(email)}:${mode}`;
    return crypto.createHash('sha256').update(key).digest('hex');
};

const hashOtp = (email: string, mode: OtpMode, otp: string): string => {
    const value = `${normalizeEmail(email)}:${mode}:${otp}`;
    return crypto.createHash('sha256').update(value).digest('hex');
};

const hashOptional = (value?: string): string | null => {
    if (!value) return null;
    return crypto.createHash('sha256').update(value).digest('hex').slice(0, 24);
};

const generateOtp = (): string => Math.floor(100000 + Math.random() * 900000).toString();

const maskRecipientForLog = (email: string): string => {
    const normalized = normalizeEmail(email);
    const [localPart, domain = 'unknown'] = normalized.split('@');
    if (!localPart) {
        return `***@${domain}`;
    }
    const visible = localPart.slice(0, Math.min(2, localPart.length));
    return `${visible}***@${domain}`;
};

const serializeLogError = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return String(error);
};

export const createOtp = async (
    email: string,
    context: OtpContext
): Promise<{ success: boolean; message?: string; expiresInSeconds?: number }> => {
    try {
        const normalizedEmail = normalizeEmail(email);
        const otp = generateOtp();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
        const docId = challengeDocIdFor(normalizedEmail, context.mode);
        const otpHash = hashOtp(normalizedEmail, context.mode, otp);

        await db.collection(OTP_COLLECTION).doc(docId).set({
            email: normalizedEmail,
            otpHash,
            mode: context.mode,
            attempts: 0,
            maxAttempts: OTP_MAX_ATTEMPTS,
            expiresAt: expiresAt.toISOString(),
            usedAt: null,
            ipHash: hashOptional(context.ip),
            uaHash: hashOptional(context.userAgent),
            locale: context.locale || null,
            fullName: context.fullName?.trim() || null,
            rolePreference: context.rolePreference || null,
            clientMeta: context.clientMeta || null,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        }, { merge: true });

        const emailResult = await sendOtpEmail(normalizedEmail, otp);
        if (!emailResult.success) {
            console.warn(
                `[OTP][SEND][FAIL] mode=${context.mode} recipient=${maskRecipientForLog(normalizedEmail)} provider=${emailResult.provider || 'unknown'} reason=${emailResult.error || 'send_failed'}`
            );
            return { success: false, message: 'Failed to send verification code' };
        }

        console.info(
            `[OTP][SEND][OK] mode=${context.mode} recipient=${maskRecipientForLog(normalizedEmail)} provider=${emailResult.provider || 'unknown'} expiresInSeconds=${OTP_EXPIRY_MINUTES * 60}`
        );

        return {
            success: true,
            expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
        };
    } catch (error) {
        console.error(
            `[OTP][SEND][ERROR] mode=${context.mode} recipient=${maskRecipientForLog(email)} reason=${serializeLogError(error)}`
        );
        return { success: false, message: 'Failed to send verification code' };
    }
};

export const verifyOtp = async (
    email: string,
    otp: string,
    mode: OtpMode
): Promise<{ success: boolean; message?: string }> => {
    try {
        const normalizedEmail = normalizeEmail(email);
        const docId = challengeDocIdFor(normalizedEmail, mode);
        const otpDoc = await db.collection(OTP_COLLECTION).doc(docId).get();

        if (!otpDoc.exists) {
            return { success: false, message: 'No verification code found. Please request a new one.' };
        }

        const otpData = otpDoc.data() as {
            mode?: OtpMode;
            otpHash?: string;
            expiresAt?: string;
            attempts?: number;
            maxAttempts?: number;
            usedAt?: string | null;
        };

        if (otpData.mode && otpData.mode !== mode) {
            return { success: false, message: 'Invalid verification request mode.' };
        }

        if (!otpData.otpHash) {
            await otpDoc.ref.delete();
            return { success: false, message: 'Verification challenge is invalid. Please request a new code.' };
        }

        if (otpData.usedAt) {
            return { success: false, message: 'Code already used. Please request a new one.' };
        }

        if (!otpData.expiresAt || new Date(otpData.expiresAt) < new Date()) {
            await otpDoc.ref.delete();
            return { success: false, message: 'Code expired. Please request a new one.' };
        }

        const attempts = Number(otpData.attempts || 0);
        const maxAttempts = Number(otpData.maxAttempts || OTP_MAX_ATTEMPTS);
        if (attempts >= maxAttempts) {
            await otpDoc.ref.delete();
            return { success: false, message: 'Too many failed attempts. Please request a new code.' };
        }

        const submittedHash = hashOtp(normalizedEmail, mode, otp.trim());
        const expectedBuffer = Buffer.from(otpData.otpHash, 'hex');
        const actualBuffer = Buffer.from(submittedHash, 'hex');
        const isMatch = expectedBuffer.length === actualBuffer.length
            && crypto.timingSafeEqual(expectedBuffer, actualBuffer);

        if (!isMatch) {
            await otpDoc.ref.update({
                attempts: attempts + 1,
                updatedAt: new Date().toISOString(),
            });
            return { success: false, message: 'Invalid code. Please try again.' };
        }

        await otpDoc.ref.update({
            usedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        return { success: true };
    } catch {
        return { success: false, message: 'Verification failed. Please try again.' };
    }
};

export const cleanupExpiredOtps = async (): Promise<void> => {
    try {
        const snapshot = await db.collection(OTP_COLLECTION).get();
        const now = new Date();
        const batch = db.batch();
        let count = 0;

        snapshot.docs.forEach((doc) => {
            const data = doc.data() as { expiresAt?: string; usedAt?: string | null };
            const isExpired = !data.expiresAt || new Date(data.expiresAt) < now;
            const isUsed = Boolean(data.usedAt);
            if (isExpired || isUsed) {
                batch.delete(doc.ref);
                count += 1;
            }
        });

        if (count > 0) {
            await batch.commit();
        }
    } catch {
        // Silent fail for cleanup
    }
};
