import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/stats', adminController.getPlatformStats);

router.get('/users', adminController.getAllUsers);

router.patch(
    '/users/:userId/status',
    validate(z.object({
        status: z.enum(['active', 'suspended', 'banned', 'pending_verification']),
    })),
    adminController.updateUserStatus
);

router.patch('/users/:userId/verify', adminController.verifyUser);

router.get('/missions', adminController.getAllMissions);

router.patch('/missions/:missionId/cancel', adminController.cancelMission);

router.get('/disputes', adminController.getDisputes);

router.patch(
    '/disputes/:disputeId/resolve',
    validate(z.object({
        resolution: z.string().min(1),
        favoredParty: z.enum(['initiator', 'contributor']),
    })),
    adminController.resolveDispute
);

export default router;
