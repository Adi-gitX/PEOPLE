import { Request, Response } from 'express';
import * as contributorsService from './contributors.service.js';
import { sendSuccess, sendError, sendCreated, sendNoContent } from '../../utils/response.js';

export const getContributors = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const { contributors } = await contributorsService.getVerifiedContributors(limit);
        sendSuccess(res, contributors);
    } catch {
        sendError(res, 'Failed to get contributors', 500);
    }
};

export const getContributorById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const profile = await contributorsService.getContributorProfile(id);
        if (!profile) {
            sendError(res, 'Contributor not found', 404);
            return;
        }
        sendSuccess(res, profile);
    } catch {
        sendError(res, 'Failed to get contributor', 500);
    }
};

export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }
        await contributorsService.updateContributorProfile(uid, req.body);
        const profile = await contributorsService.getContributorProfile(uid);
        sendSuccess(res, { message: 'Profile updated successfully', profile });
    } catch {
        sendError(res, 'Failed to update profile', 500);
    }
};

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
    } catch {
        sendError(res, 'Failed to update availability', 500);
    }
};

export const addSkill = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }
        const skill = await contributorsService.addSkill(uid, req.body);
        sendCreated(res, { message: 'Skill added successfully', skill });
    } catch (error) {
        if (error instanceof Error && error.message === 'Skill not found') {
            sendError(res, 'Skill not found', 404);
            return;
        }
        sendError(res, 'Failed to add skill', 500);
    }
};

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
    } catch {
        sendError(res, 'Failed to remove skill', 500);
    }
};

export const getAllSkills = async (_req: Request, res: Response): Promise<void> => {
    try {
        const skills = await contributorsService.getAllSkills();
        sendSuccess(res, skills);
    } catch {
        sendError(res, 'Failed to get skills', 500);
    }
};

export const getMyApplications = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }
        const applications = await contributorsService.getMyApplications(uid);
        sendSuccess(res, { applications });
    } catch {
        sendError(res, 'Failed to get applications', 500);
    }
};

export const submitVerification = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }
        const { analysis } = req.body;
        await contributorsService.submitVerification(uid, analysis);
        sendSuccess(res, { message: 'Verification submitted successfully' });
    } catch {
        sendError(res, 'Failed to submit verification', 500);
    }
};
