import { Router } from 'express';
import * as messagesController from './messages.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const router = Router();

router.get('/', requireAuth, messagesController.getMyConversations);

router.post(
    '/start',
    requireAuth,
    validate(z.object({ recipientId: z.string().min(1) })),
    messagesController.startConversation
);

router.get('/:id', requireAuth, messagesController.getConversation);

router.get('/:id/messages', requireAuth, messagesController.getMessages);

router.post(
    '/:id/messages',
    requireAuth,
    validate(z.object({ content: z.string().min(1).max(5000) })),
    messagesController.sendMessage
);

export default router;
