import { Router } from 'express';
import * as contributorsController from './contributors.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
    updateContributorProfileSchema,
    updateAvailabilitySchema,
    addSkillSchema
} from '../../schemas/index.js';

const router = Router();

/**
 * @route   GET /api/v1/contributors/public
 * @desc    Get list of verified contributors (public-safe)
 * @access  Public
 */
router.get('/public', contributorsController.getPublicContributors);

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

router.get('/me/applications', requireAuth, requireRole(['contributor', 'admin']), contributorsController.getMyApplications);

/**
 * @route   PATCH /api/v1/contributors/me
 * @desc    Update current contributor's profile
 * @access  Private
 */
router.patch(
    '/me',
    requireAuth,
    requireRole(['contributor', 'admin']),
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
    requireRole(['contributor', 'admin']),
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
    requireRole(['contributor', 'admin']),
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
    requireRole(['contributor', 'admin']),
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
    requireRole(['contributor', 'admin']),
    contributorsController.removeSkill
);

/**
 * @route   GET /api/v1/contributors/:id
 * @desc    Get contributor by ID
 * @access  Private
 */
router.get('/:id', requireAuth, contributorsController.getContributorById);

export default router;
