// ═══════════════════════════════════════════════════════════════════
// WALLET ROUTES
// API routes for wallet and balance operations
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import * as walletController from './wallet.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const router = Router();

// ─── Validation Schemas ───
const withdrawalSchema = z.object({
    amount: z.number().min(10, 'Minimum withdrawal is $10'),
    payoutMethod: z.enum(['bank_transfer']).default('bank_transfer'),
    payoutDetails: z.record(z.string()),
});

const processWithdrawalSchema = z.object({
    transactionId: z.string().optional(),
});

const cancelWithdrawalSchema = z.object({
    reason: z.string().min(1, 'Reason is required'),
});

// ─── User Routes ───

/**
 * @route   GET /api/v1/wallet
 * @desc    Get current user's wallet
 * @access  Private
 */
router.get('/', requireAuth, walletController.getMyWallet);

/**
 * @route   GET /api/v1/wallet/summary
 * @desc    Get wallet summary with stats
 * @access  Private
 */
router.get('/summary', requireAuth, walletController.getWalletSummary);

/**
 * @route   GET /api/v1/wallet/transactions
 * @desc    Get transaction history
 * @access  Private
 */
router.get('/transactions', requireAuth, walletController.getTransactions);

/**
 * @route   POST /api/v1/wallet/withdraw
 * @desc    Request withdrawal
 * @access  Private (Contributor)
 */
router.post(
    '/withdraw',
    requireAuth,
    requireRole(['contributor']),
    validate(withdrawalSchema),
    walletController.requestWithdrawal
);

/**
 * @route   POST /api/v1/wallet/withdrawals
 * @desc    Request withdrawal (canonical route)
 * @access  Private (Contributor/Admin)
 */
router.post(
    '/withdrawals',
    requireAuth,
    requireRole(['contributor']),
    validate(withdrawalSchema),
    walletController.requestWithdrawal
);

/**
 * @route   GET /api/v1/wallet/withdrawals
 * @desc    Get withdrawal history
 * @access  Private
 */
router.get('/withdrawals', requireAuth, walletController.getWithdrawals);

// ─── Admin Routes ───

/**
 * @route   POST /api/v1/wallet/withdrawals/:withdrawalId/process
 * @desc    Process withdrawal
 * @access  Private (Admin)
 */
router.post(
    '/withdrawals/:withdrawalId/process',
    requireAuth,
    requireRole(['admin']),
    validate(processWithdrawalSchema),
    walletController.processWithdrawal
);

/**
 * @route   POST /api/v1/wallet/withdrawals/:withdrawalId/cancel
 * @desc    Cancel withdrawal
 * @access  Private (Admin)
 */
router.post(
    '/withdrawals/:withdrawalId/cancel',
    requireAuth,
    requireRole(['admin']),
    validate(cancelWithdrawalSchema),
    walletController.cancelWithdrawal
);

export default router;
