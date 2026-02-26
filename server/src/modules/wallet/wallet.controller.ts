// ═══════════════════════════════════════════════════════════════════
// WALLET CONTROLLER
// API handlers for wallet and balance operations
// ═══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import * as walletService from './wallet.service.js';

/**
 * Get current user's wallet
 * GET /api/v1/wallet
 */
export const getMyWallet = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.uid;
        const wallet = await walletService.getOrCreateWallet(userId);

        res.json({
            success: true,
            data: wallet,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get wallet summary with stats
 * GET /api/v1/wallet/summary
 */
export const getWalletSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.uid;
        const summary = await walletService.getWalletSummary(userId);

        res.json({
            success: true,
            data: summary,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get transaction history
 * GET /api/v1/wallet/transactions
 */
export const getTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.uid;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const transactions = await walletService.getTransactionHistory(userId, limit, offset);

        res.json({
            success: true,
            data: transactions,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Request withdrawal
 * POST /api/v1/wallet/withdraw
 */
export const requestWithdrawal = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.uid;
        const { amount, payoutMethod, payoutDetails } = req.body;

        const withdrawal = await walletService.requestWithdrawal(
            userId,
            amount,
            payoutMethod,
            payoutDetails
        );

        res.status(201).json({
            success: true,
            data: withdrawal,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get withdrawal history
 * GET /api/v1/wallet/withdrawals
 */
export const getWithdrawals = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.uid;
        const withdrawals = await walletService.getUserWithdrawals(userId);

        res.json({
            success: true,
            data: withdrawals,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Process withdrawal (Admin)
 * POST /api/v1/wallet/withdrawals/:withdrawalId/process
 */
export const processWithdrawal = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { withdrawalId } = req.params;
        const { transactionId } = req.body;

        const withdrawal = await walletService.processWithdrawal(withdrawalId, transactionId);

        res.json({
            success: true,
            data: withdrawal,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel withdrawal (Admin)
 * POST /api/v1/wallet/withdrawals/:withdrawalId/cancel
 */
export const cancelWithdrawal = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { withdrawalId } = req.params;
        const { reason } = req.body;

        const withdrawal = await walletService.cancelWithdrawal(withdrawalId, reason);

        res.json({
            success: true,
            data: withdrawal,
        });
    } catch (error) {
        next(error);
    }
};
