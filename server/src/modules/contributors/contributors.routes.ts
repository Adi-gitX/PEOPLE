import { Router } from 'express';
import * as contributorsController from './contributors.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
    updateContributorProfileSchema,
    updateAvailabilitySchema,
    addSkillSchema
} from '../../schemas/index.js';

const router = Router();

/**
 * @route   GET /api/v1/contributors
 * @desc    Get list of verified contributors
 * @access  Private
 */
router.get('/', requireAuth, contributorsController.getContributors);

/**
 * @route   GET /api/v1/contributors/me
 * @desc    Get current contributor's profile
 * @access  Private
 */
router.get('/me', requireAuth, async (req, res) => {
    req.params.id = req.user?.uid || '';
    return contributorsController.getContributorById(req, res);
});

router.get('/me/applications', requireAuth, contributorsController.getMyApplications);

/**
 * @route   PATCH /api/v1/contributors/me
 * @desc    Update current contributor's profile
 * @access  Private
 */
router.patch(
    '/me',
    requireAuth,
    validate(updateContributorProfileSchema),
    contributorsController.updateMyProfile
);

/**
 * @route   PATCH /api/v1/contributors/me/availability
 * @desc    Update work availability status
 * @access  Private
 */
router.patch(
    '/me/availability',
    requireAuth,
    validate(updateAvailabilitySchema),
    contributorsController.updateAvailability
);

/**
 * @route   POST /api/v1/contributors/me/skills
 * @desc    Add a skill to profile
 * @access  Private
 */
router.post(
    '/me/skills',
    requireAuth,
    validate(addSkillSchema),
    contributorsController.addSkill
);

/**
 * @route   POST /api/v1/contributors/me/verification
 * @desc    Submit entrance verification
 * @access  Private
 */
router.post(
    '/me/verification',
    requireAuth,
    contributorsController.submitVerification
);

/**
 * @route   DELETE /api/v1/contributors/me/skills/:skillId
 * @desc    Remove a skill from profile
 * @access  Private
 */
router.delete(
    '/me/skills/:skillId',
    requireAuth,
    contributorsController.removeSkill
);

/**
 * @route   GET /api/v1/contributors/:id
 * @desc    Get contributor by ID
 * @access  Private
 */
router.get('/:id', requireAuth, contributorsController.getContributorById);

export default router;
