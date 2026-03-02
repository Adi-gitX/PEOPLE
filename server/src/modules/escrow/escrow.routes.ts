// ═══════════════════════════════════════════════════════════════════
// ESCROW ROUTES
// API routes for escrow operations
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import * as escrowController from './escrow.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const router = Router();

// ─── Validation Schemas ───
const createEscrowSchema = z.object({
    missionId: z.string().min(1),
    totalAmount: z.number().min(100),
    currency: z.string().default('usd'),
});

const fundEscrowSchema = z.object({
    amount: z.number().min(1),
    paymentMethodId: z.string().optional(),
});

const createFundingIntentSchema = z.object({
    amount: z.number().min(1).optional(),
    currency: z.string().min(3).max(3).optional(),
    provider: z.enum(['stripe', 'razorpay']).optional(),
});

const releaseFundsSchema = z.object({
    contributorId: z.string().min(1),
    amount: z.number().min(1),
    milestoneId: z.string().optional(),
    description: z.string().optional(),
});

const refundFundsSchema = z.object({
    amount: z.number().min(1),
    reason: z.string().optional(),
});

// ─── Routes ───

/**
 * @route   POST /api/v1/escrow
 * @desc    Create escrow account for a mission
 * @access  Private (Initiator)
 */
router.post(
    '/',
    requireAuth,
    requireRole(['initiator', 'admin']),
    validate(createEscrowSchema),
    escrowController.createEscrowAccount
);

/**
 * @route   GET /api/v1/escrow/mission/:missionId
 * @desc    Get escrow account by mission ID
 * @access  Private
 */
router.get(
    '/mission/:missionId',
    requireAuth,
    escrowController.getEscrowByMission
);

/**
 * @route   POST /api/v1/escrow/:missionId/fund-intent
 * @desc    Create funding intent/order for escrow
 * @access  Private (Initiator/Admin)
 */
router.post(
    '/:missionId/fund-intent',
    requireAuth,
    requireRole(['initiator', 'admin']),
    validate(createFundingIntentSchema),
    escrowController.createFundingIntent
);

/**
 * @route   GET /api/v1/escrow/:missionId/status
 * @desc    Get normalized mission escrow/payment status
 * @access  Private
 */
router.get(
    '/:missionId/status',
    requireAuth,
    escrowController.getMissionEscrowStatus
);

/**
 * @route   GET /api/v1/escrow/my-transactions
 * @desc    Get transactions for current user
 * @access  Private
 */
router.get(
    '/my-transactions',
    requireAuth,
    escrowController.getMyTransactions
);

/**
 * @route   GET /api/v1/escrow/:escrowId
 * @desc    Get escrow account by ID
 * @access  Private
 */
router.get(
    '/:escrowId',
    requireAuth,
    escrowController.getEscrowById
);

/**
 * @route   POST /api/v1/escrow/:escrowId/fund
 * @desc    Fund escrow account
 * @access  Private (Initiator)
 */
router.post(
    '/:escrowId/fund',
    requireAuth,
    requireRole(['initiator', 'admin']),
    validate(fundEscrowSchema),
    escrowController.fundEscrow
);

/**
 * @route   POST /api/v1/escrow/:escrowId/release
 * @desc    Release funds to contributor
 * @access  Private (Initiator/Admin)
 */
router.post(
    '/:escrowId/release',
    requireAuth,
    requireRole(['initiator', 'admin']),
    validate(releaseFundsSchema),
    escrowController.releaseFunds
);

/**
 * @route   POST /api/v1/escrow/:escrowId/refund
 * @desc    Refund funds to initiator
 * @access  Private (Admin)
 */
router.post(
    '/:escrowId/refund',
    requireAuth,
    requireRole(['admin']),
    validate(refundFundsSchema),
    escrowController.refundFunds
);

/**
 * @route   GET /api/v1/escrow/schedule/:missionId
 * @desc    Get payment schedule for mission
 * @access  Private
 */
router.get(
    '/schedule/:missionId',
    requireAuth,
    escrowController.getPaymentSchedule
);

/**
 * @route   GET /api/v1/escrow/transactions/:missionId
 * @desc    Get transactions for mission
 * @access  Private
 */
router.get(
    '/transactions/:missionId',
    requireAuth,
    escrowController.getTransactionsByMission
);

export default router;
