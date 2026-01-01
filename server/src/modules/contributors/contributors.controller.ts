import { Request, Response } from 'express';
import * as contributorsService from './contributors.service.js';
import { sendSuccess, sendError, sendCreated, sendNoContent } from '../../utils/response.js';

/**
 * GET /api/v1/contributors
 * Get list of verified contributors (for network page)
 */
export const getContributors = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;

        const { contributors } = await contributorsService.getVerifiedContributors(limit);

        sendSuccess(res, contributors);
    } catch (error) {
        console.error('Get contributors error:', error);
        sendError(res, 'Failed to get contributors', 500);
    }
};

/**
 * GET /api/v1/contributors/:id
 * Get contributor profile by ID
 */
export const getContributorById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const profile = await contributorsService.getContributorProfile(id);

        if (!profile) {
            sendError(res, 'Contributor not found', 404);
            return;
        }

        sendSuccess(res, profile);
    } catch (error) {
        console.error('Get contributor error:', error);
        sendError(res, 'Failed to get contributor', 500);
    }
};

/**
 * PATCH /api/v1/contributors/me
 * Update current contributor's profile
 */
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        await contributorsService.updateContributorProfile(uid, req.body);

        const profile = await contributorsService.getContributorProfile(uid);

        sendSuccess(res, {
            message: 'Profile updated successfully',
            profile,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        sendError(res, 'Failed to update profile', 500);
    }
};

/**
 * PATCH /api/v1/contributors/me/availability
 * Update work availability status
 */
export const updateAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        const { isLookingForWork } = req.body;

        await contributorsService.updateAvailability(uid, isLookingForWork);

        sendSuccess(res, {
            message: isLookingForWork ? 'Now looking for work' : 'Status set to incognito',
            isLookingForWork,
        });
    } catch (error) {
        console.error('Update availability error:', error);
        sendError(res, 'Failed to update availability', 500);
    }
};

/**
 * POST /api/v1/contributors/me/skills
 * Add a skill to profile
 */
export const addSkill = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        const skill = await contributorsService.addSkill(uid, req.body);

        sendCreated(res, {
            message: 'Skill added successfully',
            skill,
        });
    } catch (error) {
        console.error('Add skill error:', error);
        if (error instanceof Error && error.message === 'Skill not found') {
            sendError(res, 'Skill not found', 404);
            return;
        }
        sendError(res, 'Failed to add skill', 500);
    }
};

/**
 * DELETE /api/v1/contributors/me/skills/:skillId
 * Remove a skill from profile
 */
export const removeSkill = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        const { skillId } = req.params;

        await contributorsService.removeSkill(uid, skillId);

        sendNoContent(res);
    } catch (error) {
        console.error('Remove skill error:', error);
        sendError(res, 'Failed to remove skill', 500);
    }
};

/**
 * GET /api/v1/skills
 * Get all available skills
 */
export const getAllSkills = async (_req: Request, res: Response): Promise<void> => {
    try {
        const skills = await contributorsService.getAllSkills();
        sendSuccess(res, skills);
    } catch (error) {
        console.error('Get skills error:', error);
        sendError(res, 'Failed to get skills', 500);
    }
};
