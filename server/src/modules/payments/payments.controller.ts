import { Request, Response } from 'express';
import * as paymentsService from './payments.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { db } from '../../config/firebase.js';
import type { Mission } from '../../types/firestore.js';

const MISSIONS_COLLECTION = 'missions';

export const createCheckout = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        const role = req.userRole;
        if (!role || (role !== 'initiator' && role !== 'admin')) {
            sendError(res, 'Not authorized', 403);
            return;
        }
        const { missionId, amount, successUrl, cancelUrl } = req.body;
        const result = await paymentsService.createCheckoutSession(
            missionId,
            uid,
            amount,
            successUrl || `${process.env.FRONTEND_URL}/dashboard`,
            cancelUrl || `${process.env.FRONTEND_URL}/missions/${missionId}`,
            role
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
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }

        const role = req.userRole;
        const { missionId } = req.params;
        const missionDoc = await db.collection(MISSIONS_COLLECTION).doc(missionId).get();
        if (!missionDoc.exists) {
            sendError(res, 'Mission not found', 404);
            return;
        }

        const mission = missionDoc.data() as Mission;
        if (role !== 'admin' && mission.initiatorId !== uid) {
            sendError(res, 'Not authorized', 403);
            return;
        }

        const payments = await paymentsService.getMissionPayments(missionId);
        sendSuccess(res, { payments });
    } catch {
        sendError(res, 'Failed to get mission payments', 500);
    }
};

export const releaseEscrow = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const role = req.userRole;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        if (!role || (role !== 'initiator' && role !== 'admin')) {
            sendError(res, 'Not authorized', 403);
            return;
        }
        const { missionId, contributorId, amount } = req.body;
        const result = await paymentsService.releaseEscrow(
            missionId,
            uid,
            role,
            contributorId,
            amount
        );
        sendSuccess(res, result);
    } catch (error) {
        if (error instanceof Error) {
            if (
                error.message === 'Mission not found' ||
                error.message === 'Escrow account not found for mission'
            ) {
                sendError(res, error.message, 404);
                return;
            }
            if (error.message === 'Not authorized to release mission funds') {
                sendError(res, error.message, 403);
                return;
            }
            sendError(res, error.message, 400);
            return;
        }
        sendError(res, 'Failed to release escrow', 500);
    }
};

export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const signature = req.headers['stripe-signature'];
        const result = await paymentsService.handleStripeWebhook(
            req.body,
            typeof signature === 'string' ? signature : undefined
        );
        sendSuccess(res, result);
    } catch (error) {
        if (error instanceof Error) {
            sendError(res, error.message, 400);
            return;
        }
        sendError(res, 'Failed to process Stripe webhook', 500);
    }
};

export const razorpayWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const result = await paymentsService.handleRazorpayWebhook(
            req.body,
            typeof signature === 'string' ? signature : undefined
        );
        sendSuccess(res, result);
    } catch (error) {
        if (error instanceof Error) {
            sendError(res, error.message, 400);
            return;
        }
        sendError(res, 'Failed to process Razorpay webhook', 500);
    }
};
