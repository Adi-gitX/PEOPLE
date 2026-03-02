import { Router } from 'express';
import * as paymentsController from './payments.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const router = Router();

const checkoutSchema = z.object({
    missionId: z.string().min(1),
    amount: z.number().positive(),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
});

const releaseSchema = z.object({
    missionId: z.string().min(1),
    contributorId: z.string().min(1),
    amount: z.number().positive(),
});

router.post('/webhooks/stripe', paymentsController.stripeWebhook);
router.post('/webhooks/razorpay', paymentsController.razorpayWebhook);

router.post(
    '/checkout',
    requireAuth,
    requireRole(['initiator', 'admin']),
    validate(checkoutSchema),
    paymentsController.createCheckout
);

router.get('/balance', requireAuth, paymentsController.getMyBalance);

router.get('/history', requireAuth, paymentsController.getMyPaymentHistory);

router.get('/mission/:missionId', requireAuth, paymentsController.getMissionPayments);

router.post(
    '/release',
    requireAuth,
    requireRole(['initiator', 'admin']),
    validate(releaseSchema),
    paymentsController.releaseEscrow
);

export default router;
