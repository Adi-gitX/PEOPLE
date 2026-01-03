import { Request, Response } from 'express';
import * as paymentsService from './payments.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const createCheckout = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        const { missionId, amount, successUrl, cancelUrl } = req.body;
        const result = await paymentsService.createCheckoutSession(
            missionId,
            uid,
            amount,
            successUrl || `${process.env.FRONTEND_URL}/dashboard`,
            cancelUrl || `${process.env.FRONTEND_URL}/missions/${missionId}`
        );
        sendSuccess(res, result);
    } catch {
        sendError(res, 'Failed to create checkout session', 500);
    }
};

export const getMyBalance = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        const balance = await paymentsService.getContributorBalance(uid);
        sendSuccess(res, balance);
    } catch {
        sendError(res, 'Failed to get balance', 500);
    }
};

export const getMyPaymentHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        const { role } = req.query;
        const history = await paymentsService.getPaymentHistory(
            uid,
            (role as 'contributor' | 'initiator') || 'contributor'
        );
        sendSuccess(res, { transactions: history });
    } catch {
        sendError(res, 'Failed to get payment history', 500);
    }
};

export const getMissionPayments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;
        const payments = await paymentsService.getMissionPayments(missionId);
        sendSuccess(res, { payments });
    } catch {
        sendError(res, 'Failed to get mission payments', 500);
    }
};

export const releaseEscrow = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        const { missionId, contributorId, amount } = req.body;
        const transaction = await paymentsService.releaseEscrow(missionId, contributorId, amount);
        sendSuccess(res, { transaction });
    } catch {
        sendError(res, 'Failed to release escrow', 500);
    }
};
