import { db } from '../config/firebase.js';
import { sendOtpEmail } from './email.js';

const OTP_COLLECTION = 'emailOtps';
const OTP_EXPIRY_MINUTES = 10;

// Generate a 6-digit OTP
const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create and store OTP for an email - simplified to avoid composite index
export const createOtp = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const normalizedEmail = email.toLowerCase().trim();

        // Generate new OTP
        const otp = generateOtp();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Create unique document ID based on email (overwrite previous OTP)
        const docId = Buffer.from(normalizedEmail).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

        // Store OTP - this replaces any existing OTP for this email
        await db.collection(OTP_COLLECTION).doc(docId).set({
            email: normalizedEmail,
            otp,
            expiresAt: expiresAt.toISOString(),
            verified: false,
            attempts: 0,
            createdAt: now.toISOString(),
        });

        // Send OTP via email
        const emailResult = await sendOtpEmail(normalizedEmail, otp);

        if (!emailResult.success) {
            console.error('Failed to send OTP email:', emailResult.error);
            return { success: false, message: 'Failed to send verification code' };
        }

        console.log(`📧 OTP sent to ${normalizedEmail}`);
        return { success: true };
    } catch (error) {
        console.error('Create OTP error:', error);
        return { success: false, message: 'Failed to send verification code' };
    }
};

// Verify OTP for an email - simplified query without composite index
export const verifyOtp = async (
    email: string,
    otp: string
): Promise<{ success: boolean; message?: string }> => {
    try {
        const normalizedEmail = email.toLowerCase().trim();
        const docId = Buffer.from(normalizedEmail).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

        // Get the OTP document directly by ID
        const otpDoc = await db.collection(OTP_COLLECTION).doc(docId).get();

        if (!otpDoc.exists) {
            return { success: false, message: 'No verification code found. Please request a new one.' };
        }

        const otpData = otpDoc.data()!;

        // Check if expired
        if (new Date(otpData.expiresAt) < new Date()) {
            await otpDoc.ref.delete();
            return { success: false, message: 'Code expired. Please request a new one.' };
        }

        // Check if already verified
        if (otpData.verified) {
            return { success: false, message: 'Code already used. Please request a new one.' };
        }

        // Check max attempts (5 attempts)
        if (otpData.attempts >= 5) {
            await otpDoc.ref.delete();
            return { success: false, message: 'Too many failed attempts. Please request a new code.' };
        }

        // Increment attempts
        await otpDoc.ref.update({ attempts: otpData.attempts + 1 });

        // Verify OTP
        if (otpData.otp !== otp) {
            return { success: false, message: 'Invalid code. Please try again.' };
        }

        // Mark as verified and delete
        await otpDoc.ref.delete();

        return { success: true };
    } catch (error) {
        console.error('Verify OTP error:', error);
        return { success: false, message: 'Verification failed. Please try again.' };
    }
};

// Clean up expired OTPs (optional - can run periodically)
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
            console.log(`🧹 Cleaned up ${count} expired OTPs`);
        }
    } catch (error) {
        console.error('Cleanup OTPs error:', error);
    }
};
