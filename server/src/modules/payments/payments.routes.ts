import { Router } from 'express';
import * as paymentsController from './payments.controller.js';
import { requireAuth } from '../../middleware/auth.js';
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

router.post('/checkout', requireAuth, validate(checkoutSchema), paymentsController.createCheckout);

router.get('/balance', requireAuth, paymentsController.getMyBalance);

router.get('/history', requireAuth, paymentsController.getMyPaymentHistory);

router.get('/mission/:missionId', requireAuth, paymentsController.getMissionPayments);

router.post('/release', requireAuth, validate(releaseSchema), paymentsController.releaseEscrow);

export default router;
