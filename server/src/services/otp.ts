import { db } from '../config/firebase.js';
import { sendOtpEmail } from './email.js';

const OTP_COLLECTION = 'emailOtps';
const OTP_EXPIRY_MINUTES = 10;

interface OtpRecord {
    email: string;
    otp: string;
    expiresAt: Date;
    verified: boolean;
    attempts: number;
    createdAt: Date;
}

// Generate a 6-digit OTP
const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create and store OTP for an email
export const createOtp = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
        // Check rate limiting - max 5 OTPs per hour per email
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentOtps = await db
            .collection(OTP_COLLECTION)
            .where('email', '==', email.toLowerCase())
            .where('createdAt', '>', oneHourAgo)
            .get();

        if (recentOtps.size >= 5) {
            return { success: false, message: 'Too many OTP requests. Please try again later.' };
        }

        // Generate new OTP
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Store OTP in database
        await db.collection(OTP_COLLECTION).add({
            email: email.toLowerCase(),
            otp,
            expiresAt,
            verified: false,
            attempts: 0,
            createdAt: new Date(),
        });

        // Send OTP via email
        const emailResult = await sendOtpEmail(email, otp);

        if (!emailResult.success) {
            console.error('Failed to send OTP email:', emailResult.error);
            return { success: false, message: 'Failed to send verification code' };
        }

        console.log(`📧 OTP sent to ${email}: ${otp}`);
        return { success: true };
    } catch (error) {
        console.error('Create OTP error:', error);
        return { success: false, message: 'Failed to send verification code' };
    }
};

// Verify OTP for an email
export const verifyOtp = async (
    email: string,
    otp: string
): Promise<{ success: boolean; message?: string }> => {
    try {
        // Find the most recent unexpired OTP for this email
        const otpSnapshot = await db
            .collection(OTP_COLLECTION)
            .where('email', '==', email.toLowerCase())
            .where('verified', '==', false)
            .where('expiresAt', '>', new Date())
            .orderBy('expiresAt', 'desc')
            .limit(1)
            .get();

        if (otpSnapshot.empty) {
            return { success: false, message: 'OTP expired or not found. Please request a new one.' };
        }

        const otpDoc = otpSnapshot.docs[0];
        const otpData = otpDoc.data() as OtpRecord;

        // Check max attempts (5 attempts)
        if (otpData.attempts >= 5) {
            return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
        }

        // Increment attempts
        await otpDoc.ref.update({ attempts: otpData.attempts + 1 });

        // Verify OTP
        if (otpData.otp !== otp) {
            return { success: false, message: 'Invalid verification code. Please try again.' };
        }

        // Mark as verified
        await otpDoc.ref.update({ verified: true });

        // Clean up old OTPs for this email
        const oldOtps = await db
            .collection(OTP_COLLECTION)
            .where('email', '==', email.toLowerCase())
            .where('verified', '==', false)
            .get();

        const batch = db.batch();
        oldOtps.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error('Verify OTP error:', error);
        return { success: false, message: 'Verification failed. Please try again.' };
    }
};

// Clean up expired OTPs (run periodically)
export const cleanupExpiredOtps = async (): Promise<void> => {
    try {
        const expiredOtps = await db
            .collection(OTP_COLLECTION)
            .where('expiresAt', '<', new Date())
            .get();

        const batch = db.batch();
        expiredOtps.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();

        console.log(`🧹 Cleaned up ${expiredOtps.size} expired OTPs`);
    } catch (error) {
        console.error('Cleanup OTPs error:', error);
    }
};
