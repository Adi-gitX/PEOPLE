import { Request, Response } from 'express';
import * as missionsService from './missions.service.js';
import * as notificationsService from '../notifications/notifications.service.js';
import { sendSuccess, sendError, sendCreated, sendNoContent } from '../../utils/response.js';

// ─── Mission CRUD ───

/**
 * POST /api/v1/missions
 * Create a new mission
 */
export const createMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        const mission = await missionsService.createMission(uid, req.body);

        sendCreated(res, {
            message: 'Mission created successfully',
            mission,
        });
    } catch (error) {
        console.error('Create mission error:', error);
        sendError(res, 'Failed to create mission', 500);
    }
};

/**
 * GET /api/v1/missions
 * Get public missions (explore page)
 */
export const getMissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, complexity, status, limit } = req.query;

        const missions = await missionsService.getPublicMissions({
            type: type as string,
            complexity: complexity as string,
            status: status as string,
            limit: limit ? parseInt(limit as string) : undefined,
        });

        sendSuccess(res, missions);
    } catch (error) {
        console.error('Get missions error:', error);
        sendError(res, 'Failed to get missions', 500);
    }
};

/**
 * GET /api/v1/missions/my
 * Get current user's missions (initiator dashboard)
 */
export const getMyMissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        const missions = await missionsService.getMissionsByInitiator(uid);

        sendSuccess(res, missions);
    } catch (error) {
        console.error('Get my missions error:', error);
        sendError(res, 'Failed to get missions', 500);
    }
};

/**
 * GET /api/v1/missions/:id
 * Get mission by ID
 */
export const getMissionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const mission = await missionsService.getMissionById(id);

        if (!mission) {
            sendError(res, 'Mission not found', 404);
            return;
        }

        // Get milestones and assignments
        const [milestones, assignments] = await Promise.all([
            missionsService.getMilestones(id),
            missionsService.getAssignments(id),
        ]);

        sendSuccess(res, { mission, milestones, assignments });
    } catch (error) {
        console.error('Get mission error:', error);
        sendError(res, 'Failed to get mission', 500);
    }
};

/**
 * PATCH /api/v1/missions/:id
 * Update mission
 */
export const updateMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { id } = req.params;

        // Verify ownership
        const mission = await missionsService.getMissionById(id);
        if (!mission) {
            sendError(res, 'Mission not found', 404);
            return;
        }
        if (mission.initiatorId !== uid) {
            sendError(res, 'Not authorized to update this mission', 403);
            return;
        }

        await missionsService.updateMission(id, req.body);

        const updated = await missionsService.getMissionById(id);

        sendSuccess(res, {
            message: 'Mission updated successfully',
            mission: updated,
        });
    } catch (error) {
        console.error('Update mission error:', error);
        sendError(res, 'Failed to update mission', 500);
    }
};

/**
 * POST /api/v1/missions/:id/publish
 * Publish mission (change status to open)
 */
export const publishMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { id } = req.params;

        const mission = await missionsService.getMissionById(id);
        if (!mission) {
            sendError(res, 'Mission not found', 404);
            return;
        }
        if (mission.initiatorId !== uid) {
            sendError(res, 'Not authorized', 403);
            return;
        }
        if (mission.status !== 'draft' && mission.status !== 'pending_funding') {
            sendError(res, 'Mission cannot be published in current status', 400);
            return;
        }

        await missionsService.updateMissionStatus(id, 'open');

        sendSuccess(res, { message: 'Mission published successfully' });
    } catch (error) {
        console.error('Publish mission error:', error);
        sendError(res, 'Failed to publish mission', 500);
    }
};

/**
 * DELETE /api/v1/missions/:id
 * Cancel mission
 */
export const deleteMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { id } = req.params;

        const mission = await missionsService.getMissionById(id);
        if (!mission) {
            sendError(res, 'Mission not found', 404);
            return;
        }
        if (mission.initiatorId !== uid) {
            sendError(res, 'Not authorized', 403);
            return;
        }

        await missionsService.deleteMission(id);

        sendNoContent(res);
    } catch (error) {
        console.error('Delete mission error:', error);
        sendError(res, 'Failed to delete mission', 500);
    }
};

// ─── Milestones ───

/**
 * POST /api/v1/missions/:id/milestones
 * Add milestone to mission
 */
export const addMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { id } = req.params;

        const mission = await missionsService.getMissionById(id);
        if (!mission) {
            sendError(res, 'Mission not found', 404);
            return;
        }
        if (mission.initiatorId !== uid) {
            sendError(res, 'Not authorized', 403);
            return;
        }

        const milestone = await missionsService.addMilestone(id, req.body);

        sendCreated(res, {
            message: 'Milestone added successfully',
            milestone,
        });
    } catch (error) {
        console.error('Add milestone error:', error);
        sendError(res, 'Failed to add milestone', 500);
    }
};

/**
 * GET /api/v1/missions/:id/milestones
 * Get milestones for mission
 */
export const getMilestones = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const milestones = await missionsService.getMilestones(id);

        sendSuccess(res, milestones);
    } catch (error) {
        console.error('Get milestones error:', error);
        sendError(res, 'Failed to get milestones', 500);
    }
};

// ─── Applications ───

/**
 * POST /api/v1/missions/:id/apply
 * Apply to mission
 */
export const applyToMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found in token', 401);
            return;
        }

        const { id } = req.params;

        const mission = await missionsService.getMissionById(id);
        if (!mission) {
            sendError(res, 'Mission not found', 404);
            return;
        }
        if (mission.status !== 'open') {
            sendError(res, 'Mission is not accepting applications', 400);
            return;
        }

        const application = await missionsService.applyToMission(id, uid, req.body);

        sendCreated(res, {
            message: 'Application submitted successfully',
            application,
        });
    } catch (error) {
        console.error('Apply to mission error:', error);
        sendError(res, 'Failed to apply to mission', 500);
    }
};

/**
 * GET /api/v1/missions/:id/applications
 * Get applications for mission (initiator only)
 */
export const getApplications = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { id } = req.params;

        const mission = await missionsService.getMissionById(id);
        if (!mission) {
            sendError(res, 'Mission not found', 404);
            return;
        }
        if (mission.initiatorId !== uid) {
            sendError(res, 'Not authorized', 403);
            return;
        }

        const applications = await missionsService.getApplications(id);

        sendSuccess(res, applications);
    } catch (error) {
        console.error('Get applications error:', error);
        sendError(res, 'Failed to get applications', 500);
    }
};

/**
 * PATCH /api/v1/missions/:id/applications/:applicationId
 * Update application status (accept/reject)
 */
export const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { id, applicationId } = req.params;
        const { status } = req.body;

        const mission = await missionsService.getMissionById(id);
        if (!mission) {
            sendError(res, 'Mission not found', 404);
            return;
        }
        if (mission.initiatorId !== uid) {
            sendError(res, 'Not authorized', 403);
            return;
        }

        await missionsService.updateApplicationStatus(id, applicationId, status);

        // Trigger notifications based on status change
        const application = await missionsService.getApplicationById(id, applicationId);
        if (application && mission) {
            if (status === 'accepted') {
                await notificationsService.notifyApplicationAccepted(
                    application.contributorId,
                    mission.title,
                    id
                );
            } else if (status === 'rejected') {
                await notificationsService.notifyApplicationRejected(
                    application.contributorId,
                    mission.title
                );
            }
        }

        sendSuccess(res, { message: `Application ${status}` });
    } catch (error) {
        console.error('Update application error:', error);
        sendError(res, 'Failed to update application', 500);
    }
};

// ─── Assignment & Completion ───

/**
 * POST /api/v1/missions/:id/assign
 * Assign a contributor to mission (after accepting application)
 */
export const assignContributor = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { id } = req.params;
        const { contributorId, role = 'lead' } = req.body;

        const mission = await missionsService.getMissionById(id);
        if (!mission) {
            sendError(res, 'Mission not found', 404);
            return;
        }
        if (mission.initiatorId !== uid) {
            sendError(res, 'Not authorized', 403);
            return;
        }
        if (!['open', 'matching'].includes(mission.status)) {
            sendError(res, 'Mission is not in a state to accept assignments', 400);
            return;
        }

        const assignment = await missionsService.assignContributor(id, contributorId, role);

        // Update mission status to in_progress if this is the first assignment
        const allAssignments = await missionsService.getAssignments(id);
        if (allAssignments.length === 1) {
            await missionsService.updateMissionStatus(id, 'in_progress');
        }

        sendCreated(res, {
            message: 'Contributor assigned successfully',
            assignment,
        });

        // Send notification to assigned contributor
        await notificationsService.notifyApplicationAccepted(
            contributorId,
            mission.title,
            id
        );
    } catch (error) {
        console.error('Assign contributor error:', error);
        sendError(res, 'Failed to assign contributor', 500);
    }
};

/**
 * POST /api/v1/missions/:id/complete
 * Mark mission as completed
 */
export const completeMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { id } = req.params;

        const mission = await missionsService.getMissionById(id);
        if (!mission) {
            sendError(res, 'Mission not found', 404);
            return;
        }
        if (mission.initiatorId !== uid) {
            sendError(res, 'Not authorized', 403);
            return;
        }
        if (mission.status !== 'in_progress' && mission.status !== 'in_review') {
            sendError(res, 'Mission cannot be completed in current status', 400);
            return;
        }

        await missionsService.updateMissionStatus(id, 'completed');

        // Notify all assigned contributors about completion
        const assignments = await missionsService.getAssignments(id);
        for (const assignment of assignments) {
            await notificationsService.notifyMissionCompleted(
                assignment.contributorId,
                mission.title,
                id
            );
        }

        sendSuccess(res, { message: 'Mission marked as completed' });
    } catch (error) {
        console.error('Complete mission error:', error);
        sendError(res, 'Failed to complete mission', 500);
    }
};
