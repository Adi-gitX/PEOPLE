import { Router, Request, Response } from 'express';
import { sendContactFormEmail } from '../../services/email.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const router = Router();

const contactSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    subject: z.string().min(1).max(200),
    message: z.string().min(10).max(5000),
});

router.post(
    '/',
    validate(contactSchema),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, email, subject, message } = req.body;

            const success = await sendContactFormEmail(email, name, subject, message);

            if (success) {
                sendSuccess(res, {
                    message: 'Your message has been sent! We will get back to you soon.'
                });
            } else {
                sendError(res, 'Failed to send message. Please try again.', 500);
            }
        } catch {
            sendError(res, 'Failed to send message', 500);
        }
    }
);

export default router;
