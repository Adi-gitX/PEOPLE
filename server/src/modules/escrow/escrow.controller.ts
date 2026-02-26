// ═══════════════════════════════════════════════════════════════════
// ESCROW CONTROLLER
// API handlers for escrow operations
// ═══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import * as escrowService from './escrow.service.js';

/**
 * Create escrow account for a mission
 * POST /api/v1/escrow
 */
export const createEscrowAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { missionId, totalAmount, currency } = req.body;
        const initiatorId = req.user!.uid;

        const escrow = await escrowService.createEscrowAccount(
            missionId,
            initiatorId,
            totalAmount,
            currency
        );

        res.status(201).json({
            success: true,
            data: escrow,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get escrow account by mission ID
 * GET /api/v1/escrow/mission/:missionId
 */
export const getEscrowByMission = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { missionId } = req.params;

        const escrow = await escrowService.getEscrowAccountByMission(missionId);

        if (!escrow) {
            res.status(404).json({
                success: false,
                error: 'Escrow account not found',
            });
            return;
        }

        res.json({
            success: true,
            data: escrow,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get escrow account by ID
 * GET /api/v1/escrow/:escrowId
 */
export const getEscrowById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { escrowId } = req.params;

        const escrow = await escrowService.getEscrowAccountById(escrowId);

        if (!escrow) {
            res.status(404).json({
                success: false,
                error: 'Escrow account not found',
            });
            return;
        }

        res.json({
            success: true,
            data: escrow,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Fund escrow account
 * POST /api/v1/escrow/:escrowId/fund
 */
export const fundEscrow = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { escrowId } = req.params;
        const { amount, paymentMethodId } = req.body;

        const result = await escrowService.fundEscrow(escrowId, amount, paymentMethodId);

        if (!result.success) {
            if (result.clientSecret) {
                // Requires additional action (3D Secure, etc.)
                res.status(202).json({
                    success: false,
                    requiresAction: true,
                    clientSecret: result.clientSecret,
                });
                return;
            }
            res.status(400).json({
                success: false,
                error: result.error,
            });
            return;
        }

        res.json({
            success: true,
            data: result.escrow,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Release funds to contributor
 * POST /api/v1/escrow/:escrowId/release
 */
export const releaseFunds = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { escrowId } = req.params;
        const { contributorId, amount, milestoneId, description } = req.body;

        const result = await escrowService.releaseFunds(
            escrowId,
            contributorId,
            amount,
            milestoneId,
            description
        );

        if (!result.success) {
            res.status(400).json({
                success: false,
                error: result.error,
            });
            return;
        }

        res.json({
            success: true,
            data: result.transaction,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Refund funds to initiator
 * POST /api/v1/escrow/:escrowId/refund
 */
export const refundFunds = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { escrowId } = req.params;
        const { amount, reason } = req.body;

        const result = await escrowService.refundFunds(escrowId, amount, reason);

        if (!result.success) {
            res.status(400).json({
                success: false,
                error: result.error,
            });
            return;
        }

        res.json({
            success: true,
            data: result.transaction,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get payment schedule for mission
 * GET /api/v1/escrow/schedule/:missionId
 */
export const getPaymentSchedule = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { missionId } = req.params;

        const schedule = await escrowService.getPaymentSchedule(missionId);

        if (!schedule) {
            res.status(404).json({
                success: false,
                error: 'Payment schedule not found',
            });
            return;
        }

        res.json({
            success: true,
            data: schedule,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get transactions for mission
 * GET /api/v1/escrow/transactions/:missionId
 */
export const getTransactionsByMission = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { missionId } = req.params;

        const transactions = await escrowService.getTransactionsByMission(missionId);

        res.json({
            success: true,
            data: transactions,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get transactions for current user
 * GET /api/v1/escrow/my-transactions
 */
export const getMyTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.uid;

        const transactions = await escrowService.getTransactionsByUser(userId);

        res.json({
            success: true,
            data: transactions,
        });
    } catch (error) {
        next(error);
    }
};
