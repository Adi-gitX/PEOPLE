import { Router } from 'express';
import * as usersController from './users.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateActiveRoleSchema, updateUserSchema } from '../../schemas/index.js';

const router = Router();

/**
 * @route   POST /api/v1/users/register
 * @desc    Register a new user (after Firebase Auth signup)
 * @access  Private (requires Firebase token)
 */
router.post(
    '/register',
    requireAuth,
    validate(createUserSchema),
    usersController.registerUser
);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get(
    '/me',
    requireAuth,
    usersController.getCurrentUser
);

/**
 * @route   GET /api/v1/users/me/role-capabilities
 * @desc    Get role switching capabilities for current user
 * @access  Private
 */
router.get(
    '/me/role-capabilities',
    requireAuth,
    usersController.getMyRoleCapabilities
);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user
 * @access  Private
 */
router.patch(
    '/me',
    requireAuth,
    validate(updateUserSchema),
    usersController.updateCurrentUser
);

/**
 * @route   PATCH /api/v1/users/me/active-role
 * @desc    Set active workspace role context for current user
 * @access  Private
 */
router.patch(
    '/me/active-role',
    requireAuth,
    validate(updateActiveRoleSchema),
    usersController.updateMyActiveRole
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
    '/:id',
    requireAuth,
    usersController.getUserById
);

export default router;
