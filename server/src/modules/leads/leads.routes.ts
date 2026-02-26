import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { upsertNewsletterLead, upsertWaitlistLead } from './leads.service.js';

const router = Router();

const waitlistSchema = z.object({
    email: z.string().email(),
    role: z.enum(['contributor', 'initiator']).optional(),
    source: z.string().max(100).optional(),
    name: z.string().max(100).optional(),
});

const newsletterSchema = z.object({
    email: z.string().email(),
    source: z.string().max(100).optional(),
});

router.post(
    '/waitlist',
    validate(waitlistSchema),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await upsertWaitlistLead(req.body);

            sendSuccess(res, {
                id: result.id,
                alreadyExists: result.alreadyExists,
                message: result.alreadyExists
                    ? 'You are already on the waitlist. We updated your preferences.'
                    : 'You have been added to the waitlist.',
            });
        } catch {
            sendError(res, 'Failed to join waitlist', 500);
        }
    }
);

router.post(
    '/newsletter',
    validate(newsletterSchema),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await upsertNewsletterLead(req.body);

            sendSuccess(res, {
                id: result.id,
                alreadyExists: result.alreadyExists,
                message: result.alreadyExists
                    ? 'You are already subscribed to updates.'
                    : 'Subscribed to updates successfully.',
            });
        } catch {
            sendError(res, 'Failed to subscribe', 500);
        }
    }
);

export default router;
