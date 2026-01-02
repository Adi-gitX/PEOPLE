import { Router, Request, Response } from 'express';
import * as otpService from '../../services/otp.js';
import * as usersService from '../users/users.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';
import { admin } from '../../config/firebase.js';

const router = Router();

const sendOtpSchema = z.object({
    email: z.string().email(),
});

const verifyOtpSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    fullName: z.string().min(1).optional(),
    role: z.enum(['contributor', 'initiator']).optional(),
});

// Send OTP to email
router.post(
    '/send',
    validate(sendOtpSchema),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { email } = req.body;

            const result = await otpService.createOtp(email);

            if (result.success) {
                sendSuccess(res, { message: 'Verification code sent to your email' });
            } else {
                sendError(res, result.message || 'Failed to send OTP', 400);
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            sendError(res, 'Failed to send verification code', 500);
        }
    }
);

// Verify OTP and create/login user
router.post(
    '/verify',
    validate(verifyOtpSchema),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, otp, fullName, role } = req.body;

            // Verify the OTP
            const verifyResult = await otpService.verifyOtp(email, otp);

            if (!verifyResult.success) {
                sendError(res, verifyResult.message || 'Invalid OTP', 400);
                return;
            }

            // Check if user exists in Firebase
            let firebaseUser;
            try {
                firebaseUser = await admin.auth().getUserByEmail(email);
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    // Create new Firebase user
                    firebaseUser = await admin.auth().createUser({
                        email,
                        emailVerified: true,
                        displayName: fullName || 'User',
                    });

                    // Create user in our database
                    await usersService.createUser(firebaseUser.uid, {
                        email,
                        fullName: fullName || 'User',
                        role: role || 'contributor',
                    });
                } else {
                    throw error;
                }
            }

            // Generate custom token for client-side sign in
            const customToken = await admin.auth().createCustomToken(firebaseUser.uid);

            // Get user profile
            const { user, profile } = await usersService.getUserWithProfile(firebaseUser.uid);

            sendSuccess(res, {
                message: 'Verification successful',
                customToken,
                user,
                profile,
            });
        } catch (error) {
            console.error('Verify OTP error:', error);
            sendError(res, 'Verification failed', 500);
        }
    }
);

export default router;
