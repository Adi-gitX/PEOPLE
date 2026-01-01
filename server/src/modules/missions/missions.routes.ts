import { Router } from 'express';
import * as missionsController from './missions.controller.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
    createMissionSchema,
    updateMissionSchema,
    createMilestoneSchema,
    createApplicationSchema,
    applicationStatusSchema,
} from '../../schemas/index.js';
import { z } from 'zod';

const router = Router();

// ─── Mission CRUD ───

/**
 * @route   GET /api/v1/missions
 * @desc    Get public missions (explore page)
 * @access  Public (with optional auth for personalization)
 */
router.get('/', optionalAuth, missionsController.getMissions);

/**
 * @route   GET /api/v1/missions/my
 * @desc    Get current user's missions
 * @access  Private
 */
router.get('/my', requireAuth, missionsController.getMyMissions);

/**
 * @route   POST /api/v1/missions
 * @desc    Create a new mission
 * @access  Private (Initiators)
 */
router.post(
    '/',
    requireAuth,
    validate(createMissionSchema),
    missionsController.createMission
);

/**
 * @route   GET /api/v1/missions/:id
 * @desc    Get mission by ID with details
 * @access  Public (for open missions) / Private (for draft)
 */
router.get('/:id', optionalAuth, missionsController.getMissionById);

/**
 * @route   PATCH /api/v1/missions/:id
 * @desc    Update mission
 * @access  Private (Owner only)
 */
router.patch(
    '/:id',
    requireAuth,
    validate(updateMissionSchema),
    missionsController.updateMission
);

/**
 * @route   POST /api/v1/missions/:id/publish
 * @desc    Publish mission
 * @access  Private (Owner only)
 */
router.post('/:id/publish', requireAuth, missionsController.publishMission);

/**
 * @route   DELETE /api/v1/missions/:id
 * @desc    Cancel mission
 * @access  Private (Owner only)
 */
router.delete('/:id', requireAuth, missionsController.deleteMission);

// ─── Milestones ───

/**
 * @route   GET /api/v1/missions/:id/milestones
 * @desc    Get milestones for mission
 * @access  Private
 */
router.get('/:id/milestones', requireAuth, missionsController.getMilestones);

/**
 * @route   POST /api/v1/missions/:id/milestones
 * @desc    Add milestone to mission
 * @access  Private (Owner only)
 */
router.post(
    '/:id/milestones',
    requireAuth,
    validate(createMilestoneSchema),
    missionsController.addMilestone
);

// ─── Applications ───

/**
 * @route   POST /api/v1/missions/:id/apply
 * @desc    Apply to mission
 * @access  Private (Contributors)
 */
router.post(
    '/:id/apply',
    requireAuth,
    validate(createApplicationSchema),
    missionsController.applyToMission
);

/**
 * @route   GET /api/v1/missions/:id/applications
 * @desc    Get applications for mission
 * @access  Private (Owner only)
 */
router.get('/:id/applications', requireAuth, missionsController.getApplications);

/**
 * @route   PATCH /api/v1/missions/:id/applications/:applicationId
 * @desc    Update application status
 * @access  Private (Owner only)
 */
router.patch(
    '/:id/applications/:applicationId',
    requireAuth,
    validate(z.object({ status: applicationStatusSchema })),
    missionsController.updateApplicationStatus
);

export default router;
