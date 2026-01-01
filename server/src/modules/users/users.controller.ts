import { Request, Response } from 'express';
import * as usersService from './users.service.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/response.js';

/**
 * POST /api/v1/users/register
 * Create a new user after Firebase Auth signup
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        // Check if user already exists
        const exists = await usersService.userExists(uid);
        if (exists) {
            sendError(res, 'User already registered', 409);
            return;
        }

        const { email, fullName, role } = req.body;

        const result = await usersService.createUser(uid, { email, fullName, role });

        sendCreated(res, {
            message: 'User registered successfully',
            user: result.user,
            profile: result.profile,
        });
    } catch (error) {
        console.error('Register user error:', error);
        sendError(res, 'Failed to register user', 500);
    }
};

/**
 * GET /api/v1/users/me
 * Get current authenticated user
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        const { user, profile } = await usersService.getUserWithProfile(uid);

        if (!user) {
            sendError(res, 'User not found', 404);
            return;
        }

        sendSuccess(res, { user, profile });
    } catch (error) {
        console.error('Get current user error:', error);
        sendError(res, 'Failed to get user', 500);
    }
};

/**
 * GET /api/v1/users/:id
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { user, profile } = await usersService.getUserWithProfile(id);

        if (!user) {
            sendError(res, 'User not found', 404);
            return;
        }

        sendSuccess(res, { user, profile });
    } catch (error) {
        console.error('Get user by ID error:', error);
        sendError(res, 'Failed to get user', 500);
    }
};

/**
 * PATCH /api/v1/users/me
 * Update current user
 */
export const updateCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        const { fullName, avatarUrl } = req.body;

        await usersService.updateUser(uid, { fullName, avatarUrl });

        const { user, profile } = await usersService.getUserWithProfile(uid);

        sendSuccess(res, {
            message: 'User updated successfully',
            user,
            profile
        });
    } catch (error) {
        console.error('Update user error:', error);
        sendError(res, 'Failed to update user', 500);
    }
};
