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
        } catch {
            sendError(res, 'Failed to send verification code', 500);
        }
    }
);

router.post(
    '/verify',
    validate(verifyOtpSchema),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, otp, fullName, role } = req.body;

            const verifyResult = await otpService.verifyOtp(email, otp);

            if (!verifyResult.success) {
                sendError(res, verifyResult.message || 'Invalid OTP', 400);
                return;
            }

            let firebaseUser;
            try {
                firebaseUser = await admin.auth().getUserByEmail(email);
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    firebaseUser = await admin.auth().createUser({
                        email,
                        emailVerified: true,
                        displayName: fullName || 'User',
                    });

                    await usersService.createUser(firebaseUser.uid, {
                        email,
                        fullName: fullName || 'User',
                        role: role || 'contributor',
                    });
                } else {
                    throw error;
                }
            }

            const customToken = await admin.auth().createCustomToken(firebaseUser.uid);
            const { user, profile } = await usersService.getUserWithProfile(firebaseUser.uid);

            sendSuccess(res, {
                message: 'Verification successful',
                customToken,
                user,
                profile,
            });
        } catch {
            sendError(res, 'Verification failed', 500);
        }
    }
);

export default router;
