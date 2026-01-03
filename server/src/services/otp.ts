import { db } from '../config/firebase.js';
import { sendOtpEmail } from './email.js';

const OTP_COLLECTION = 'emailOtps';
const OTP_EXPIRY_MINUTES = 10;

const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createOtp = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const normalizedEmail = email.toLowerCase().trim();

        const otp = generateOtp();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

        const docId = Buffer.from(normalizedEmail).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

        await db.collection(OTP_COLLECTION).doc(docId).set({
            email: normalizedEmail,
            otp,
            expiresAt: expiresAt.toISOString(),
            verified: false,
            attempts: 0,
            createdAt: now.toISOString(),
        });

        const emailResult = await sendOtpEmail(normalizedEmail, otp);

        if (!emailResult.success) {
            return { success: false, message: 'Failed to send verification code' };
        }

        return { success: true };
    } catch {
        return { success: false, message: 'Failed to send verification code' };
    }
};

export const verifyOtp = async (
    email: string,
    otp: string
): Promise<{ success: boolean; message?: string }> => {
    try {
        const normalizedEmail = email.toLowerCase().trim();
        const docId = Buffer.from(normalizedEmail).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

        const otpDoc = await db.collection(OTP_COLLECTION).doc(docId).get();

        if (!otpDoc.exists) {
            return { success: false, message: 'No verification code found. Please request a new one.' };
        }

        const otpData = otpDoc.data()!;

        if (new Date(otpData.expiresAt) < new Date()) {
            await otpDoc.ref.delete();
            return { success: false, message: 'Code expired. Please request a new one.' };
        }

        if (otpData.verified) {
            return { success: false, message: 'Code already used. Please request a new one.' };
        }

        if (otpData.attempts >= 5) {
            await otpDoc.ref.delete();
            return { success: false, message: 'Too many failed attempts. Please request a new code.' };
        }

        await otpDoc.ref.update({ attempts: otpData.attempts + 1 });

        if (otpData.otp !== otp) {
            return { success: false, message: 'Invalid code. Please try again.' };
        }

        await otpDoc.ref.delete();

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
            const data = doc.data();
            if (new Date(data.expiresAt) < now) {
                batch.delete(doc.ref);
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
        }
    } catch {
        // Silent fail for cleanup
    }
};
