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
    mode: z.enum(['login', 'signup']).default('login'),
    fullName: z.string().min(1).max(120).optional(),
    rolePreference: z.enum(['contributor', 'initiator']).optional(),
    locale: z.string().max(40).optional(),
    clientMeta: z.record(z.unknown()).optional(),
});

const verifyOtpSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    mode: z.enum(['login', 'signup']).default('login'),
    fullName: z.string().min(1).max(120).optional(),
    rolePreference: z.enum(['contributor', 'initiator']).optional(),
});

router.post(
    '/send',
    validate(sendOtpSchema),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const {
                email,
                mode,
                fullName,
                rolePreference,
                locale,
                clientMeta,
            } = req.body;
            const result = await otpService.createOtp(email, {
                mode,
                fullName,
                rolePreference,
                locale,
                clientMeta,
                ip: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            if (result.success) {
                sendSuccess(res, {
                    message: 'Verification code sent to your email',
                    mode,
                    expiresInSeconds: result.expiresInSeconds,
                });
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
            const { email, otp, mode, fullName, rolePreference } = req.body;
            const normalizedEmail = `${email}`.trim().toLowerCase();

            const verifyResult = await otpService.verifyOtp(normalizedEmail, otp, mode);

            if (!verifyResult.success) {
                sendError(res, verifyResult.message || 'Invalid OTP', 400);
                return;
            }

            let isNewUser = false;
            let firebaseUser;
            try {
                firebaseUser = await admin.auth().getUserByEmail(normalizedEmail);
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    if (mode === 'login') {
                        sendError(res, 'Account not found. Sign up first.', 404);
                        return;
                    }
                    firebaseUser = await admin.auth().createUser({
                        email: normalizedEmail,
                        emailVerified: true,
                        displayName: fullName || 'User',
                    });
                    isNewUser = true;
                } else {
                    throw error;
                }
            }

            const existingUser = await usersService.getUserById(firebaseUser.uid);
            if (!existingUser) {
                if (mode === 'login' && !isNewUser) {
                    sendError(res, 'Profile not found. Complete signup first.', 404);
                    return;
                }

                await usersService.createUser(firebaseUser.uid, {
                    email: normalizedEmail,
                    fullName: fullName || firebaseUser.displayName || 'User',
                    role: rolePreference || 'contributor',
                });
                isNewUser = true;
            }

            const customToken = await admin.auth().createCustomToken(firebaseUser.uid);
            const context = await usersService.getUserRoleContext(firebaseUser.uid);
            if (!context) {
                sendError(res, 'Failed to load user profile context', 500);
                return;
            }

            sendSuccess(res, {
                message: 'Verification successful',
                customToken,
                user: context.user,
                profile: context.profile,
                profiles: context.profiles,
                availableRoles: context.availableRoles,
                activeRole: context.activeRole,
                isNewUser,
            });
        } catch {
            sendError(res, 'Verification failed', 500);
        }
    }
);

export default router;
