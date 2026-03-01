import { Router } from 'express';
import * as initiatorsController from './initiators.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateInitiatorProfileSchema } from '../../schemas/index.js';

const router = Router();

router.get('/', requireAuth, initiatorsController.getInitiators);

router.get('/me', requireAuth, requireRole(['initiator', 'admin']), initiatorsController.getMyProfile);

router.patch(
    '/me',
    requireAuth,
    requireRole(['initiator', 'admin']),
    validate(updateInitiatorProfileSchema),
    initiatorsController.updateMyProfile
);

router.get('/:id', requireAuth, initiatorsController.getInitiatorById);

export default router;
