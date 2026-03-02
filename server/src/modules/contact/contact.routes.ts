import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.js';
import { supportLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { createSupportTicketSchema } from '../../schemas/index.js';
import * as supportController from '../support/support.controller.js';

const router = Router();

router.post(
    '/',
    supportLimiter,
    optionalAuth,
    validate(createSupportTicketSchema),
    supportController.createTicket
);

export default router;
