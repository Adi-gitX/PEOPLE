import { Request, Response } from 'express';
import { env } from '../../config/index.js';
import * as usersService from './users.service.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/response.js';

const ROLE_ROUTES = {
    contributor: '/dashboard/contributor',
    initiator: '/dashboard/initiator',
    admin: '/admin',
} as const;

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }
        const exists = await usersService.userExists(uid);
        if (exists) {
            sendError(res, 'User already registered', 409);
            return;
        }
        const { email, fullName, role } = req.body;
        if (role === 'admin') {
            sendError(res, 'Admin role cannot be assigned via public registration', 403);
            return;
        }
        const result = await usersService.createUser(uid, { email, fullName, role });
        sendCreated(res, {
            message: 'User registered successfully',
            user: result.user,
            profile: result.profile,
            profiles: result.profiles,
            availableRoles: result.availableRoles,
            activeRole: result.activeRole,
        });
    } catch {
        sendError(res, 'Failed to register user', 500);
    }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }
        const context = await usersService.getUserRoleContext(uid);
        if (!context) {
            sendError(res, 'User not found', 404);
            return;
        }
        sendSuccess(res, {
            user: context.user,
            profile: context.profile,
            profiles: context.profiles,
            availableRoles: context.availableRoles,
            activeRole: context.activeRole,
        });
    } catch {
        sendError(res, 'Failed to get user', 500);
    }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { user, profile } = await usersService.getUserWithProfile(id);
        if (!user) {
            sendError(res, 'User not found', 404);
            return;
        }
        sendSuccess(res, { user, profile });
    } catch {
        sendError(res, 'Failed to get user', 500);
    }
};

export const updateCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }
        const { fullName, avatarUrl } = req.body;
        await usersService.updateUser(uid, { fullName, avatarUrl });
        const context = await usersService.getUserRoleContext(uid);
        sendSuccess(res, {
            message: 'User updated successfully',
            user: context?.user || null,
            profile: context?.profile || null,
            profiles: context?.profiles || null,
            availableRoles: context?.availableRoles || [],
            activeRole: context?.activeRole || null,
        });
    } catch (error) {
        if (env.NODE_ENV === 'development') {
            console.error('[users:updateCurrentUser] failed', error);
        }
        sendError(res, 'Failed to update user', 500);
    }
};

export const getMyRoleCapabilities = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        const capabilities = await usersService.getRoleCapabilities(uid);
        if (!capabilities) {
            sendError(res, 'User not found', 404);
            return;
        }

        sendSuccess(res, capabilities);
    } catch {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'Failed to resolve role capabilities', 500);
            return;
        }

        const user = await usersService.getUserById(uid);
        if (!user) {
            sendError(res, 'User not found', 404);
            return;
        }

        sendSuccess(res, {
            currentRole: user.primaryRole,
            availableRoles: [user.primaryRole],
            routes: ROLE_ROUTES,
            disabledRoles: {
                contributor: user.primaryRole === 'contributor' ? null : 'Contributor role is unavailable for this account',
                initiator: user.primaryRole === 'initiator' ? null : 'Initiator role is unavailable for this account',
                admin: user.primaryRole === 'admin' ? null : 'Admin role is unavailable for this account',
            },
        });
    }
};

export const updateMyActiveRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        const { role } = req.body as { role: 'contributor' | 'initiator' };
        const context = await usersService.setActiveRole(uid, role);

        sendSuccess(res, {
            message: 'Active role updated successfully',
            user: context.user,
            profile: context.profile,
            profiles: context.profiles,
            availableRoles: context.availableRoles,
            activeRole: context.activeRole,
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'User not found') {
                sendError(res, 'User not found', 404);
                return;
            }
            if (
                error.message === 'Requested role profile is unavailable'
                || error.message === 'Admin account role cannot be switched'
            ) {
                sendError(res, error.message, 400);
                return;
            }
        }
        sendError(res, 'Failed to update active role', 500);
    }
};
