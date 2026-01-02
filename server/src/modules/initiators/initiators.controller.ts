import { Request, Response } from 'express';
import * as initiatorsService from './initiators.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        const { user, profile } = await initiatorsService.getInitiatorById(uid);

        if (!user) {
            sendError(res, 'User not found', 404);
            return;
        }

        if (user.primaryRole !== 'initiator') {
            sendError(res, 'User is not an initiator', 403);
            return;
        }

        sendSuccess(res, { user, profile });
    } catch (error) {
        console.error('Get initiator profile error:', error);
        sendError(res, 'Failed to get initiator profile', 500);
    }
};

export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        await initiatorsService.updateInitiatorProfile(uid, req.body);
        const { user, profile } = await initiatorsService.getInitiatorById(uid);

        sendSuccess(res, {
            message: 'Profile updated successfully',
            user,
            profile,
        });
    } catch (error) {
        console.error('Update initiator profile error:', error);
        sendError(res, 'Failed to update profile', 500);
    }
};

export const getInitiatorById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { user, profile } = await initiatorsService.getInitiatorById(id);

        if (!user || !profile) {
            sendError(res, 'Initiator not found', 404);
            return;
        }

        const publicProfile = {
            id: user.id,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            companyName: profile.companyName,
            companyUrl: profile.companyUrl,
            industry: profile.industry,
            isVerified: profile.isVerified,
            totalMissionsPosted: profile.totalMissionsPosted,
            averageRating: profile.averageRating,
        };

        sendSuccess(res, { initiator: publicProfile });
    } catch (error) {
        console.error('Get initiator by ID error:', error);
        sendError(res, 'Failed to get initiator', 500);
    }
};

export const getInitiators = async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit, verified } = req.query;

        const initiators = await initiatorsService.getInitiators({
            limit: limit ? parseInt(limit as string, 10) : 20,
            verifiedOnly: verified === 'true',
        });

        sendSuccess(res, { initiators });
    } catch (error) {
        console.error('Get initiators error:', error);
        sendError(res, 'Failed to get initiators', 500);
    }
};
