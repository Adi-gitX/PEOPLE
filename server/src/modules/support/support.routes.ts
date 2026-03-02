import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';
import { validate } from '../../middleware/validate.js';
import { supportLimiter } from '../../middleware/rateLimit.js';
import { createSupportTicketSchema, processSupportOutboxSchema } from '../../schemas/index.js';
import * as supportController from './support.controller.js';

const supportRoutes = Router();
const internalSupportRoutes = Router();

supportRoutes.post(
    '/tickets',
    supportLimiter,
    optionalAuth,
    validate(createSupportTicketSchema),
    supportController.createTicket
);

internalSupportRoutes.post(
    '/outbox/process',
    requireAuth,
    requireAdmin,
    validate(processSupportOutboxSchema),
    supportController.processOutboxNow
);

export { supportRoutes, internalSupportRoutes };

