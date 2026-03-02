import { Request, Response } from 'express';
import * as adminService from './admin.service.js';
import * as walletService from '../wallet/wallet.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const parseIntQuery = (value: unknown, fallback: number): number => {
    if (typeof value !== 'string') return fallback;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

export const getPlatformStats = async (_req: Request, res: Response): Promise<void> => {
    try {
        const stats = await adminService.getPlatformStats();
        sendSuccess(res, stats);
    } catch {
        sendError(res, 'Failed to get platform stats', 500);
    }
};

export const getMyAdminScopes = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'Authentication required', 401);
            return;
        }

        const summary = await adminService.getAdminScopeSummary(uid);
        if (!summary) {
            sendError(res, 'Admin access required', 403);
            return;
        }

        sendSuccess(res, summary);
    } catch {
        sendError(res, 'Failed to get admin scope summary', 500);
    }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit, offset, role, status } = req.query;
        const result = await adminService.getAllUsers({
            limit: limit ? parseInt(limit as string, 10) : undefined,
            offset: offset ? parseInt(offset as string, 10) : undefined,
            role: role as 'contributor' | 'initiator' | 'admin' | undefined,
            status: status as UserAccountStatus,
        });
        sendSuccess(res, result);
    } catch {
        sendError(res, 'Failed to get users', 500);
    }
};

type UserAccountStatus = 'active' | 'suspended' | 'banned' | 'pending_verification';

export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const { status } = req.body as { status: UserAccountStatus };
        await adminService.updateUserStatus(userId, status);
        await adminService.writeAdminAuditLog({
            actorId: req.user?.uid || 'unknown',
            scope: 'users.write',
            action: 'user.status.update',
            resourceType: 'user',
            resourceId: userId,
            reason: `status:${status}`,
            metadata: { status },
        });
        sendSuccess(res, { message: 'User status updated' });
    } catch {
        sendError(res, 'Failed to update user status', 500);
    }
};

export const verifyUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        await adminService.verifyUser(userId);
        await adminService.writeAdminAuditLog({
            actorId: req.user?.uid || 'unknown',
            scope: 'users.write',
            action: 'user.verify',
            resourceType: 'user',
            resourceId: userId,
        });
        sendSuccess(res, { message: 'User verified successfully' });
    } catch (error: unknown) {
        if (error instanceof Error) {
            sendError(res, error.message || 'Failed to verify user', 500);
            return;
        }
        sendError(res, 'Failed to verify user', 500);
    }
};

export const getAllMissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit, offset, status } = req.query;
        const result = await adminService.getAllMissions({
            limit: limit ? parseInt(limit as string, 10) : undefined,
            offset: offset ? parseInt(offset as string, 10) : undefined,
            status: status as MissionStatus,
        });
        sendSuccess(res, result);
    } catch {
        sendError(res, 'Failed to get missions', 500);
    }
};

type MissionStatus = 'draft' | 'pending_funding' | 'open' | 'matching' | 'in_progress' | 'in_review' | 'completed' | 'cancelled' | 'disputed';

export const cancelMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;
        await adminService.cancelMission(missionId);
        await adminService.writeAdminAuditLog({
            actorId: req.user?.uid || 'unknown',
            scope: 'missions.write',
            action: 'mission.cancel',
            resourceType: 'mission',
            resourceId: missionId,
        });
        sendSuccess(res, { message: 'Mission cancelled' });
    } catch {
        sendError(res, 'Failed to cancel mission', 500);
    }
};

export const getDisputes = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, limit } = req.query;
        const disputes = await adminService.getDisputes({
            status: status as DisputeStatus,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });
        sendSuccess(res, { disputes });
    } catch {
        sendError(res, 'Failed to get disputes', 500);
    }
};

type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export const resolveDispute = async (req: Request, res: Response): Promise<void> => {
    try {
        const { disputeId } = req.params;
        const { resolution, favoredParty } = req.body as {
            resolution: string;
            favoredParty: 'initiator' | 'contributor';
        };
        await adminService.resolveDispute(disputeId, resolution, favoredParty);
        await adminService.writeAdminAuditLog({
            actorId: req.user?.uid || 'unknown',
            scope: 'disputes.resolve',
            action: 'dispute.resolve',
            resourceType: 'dispute',
            resourceId: disputeId,
            reason: resolution,
            metadata: { favoredParty },
        });
        sendSuccess(res, { message: 'Dispute resolved' });
    } catch {
        sendError(res, 'Failed to resolve dispute', 500);
    }
};

export const getWithdrawals = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await adminService.listAdminWithdrawals({
            status: req.query.status as WithdrawalStatus | undefined,
            limit: parseIntQuery(req.query.limit, 30),
            cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
        });
        sendSuccess(res, result);
    } catch {
        sendError(res, 'Failed to get withdrawals', 500);
    }
};

type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export const updateWithdrawalStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.user?.uid;
        const { withdrawalId } = req.params;
        const { action, notes, transactionReference } = req.body as {
            action: 'approve' | 'reject' | 'mark_paid';
            notes?: string;
            transactionReference?: string;
        };

        if (!adminId) {
            sendError(res, 'User ID not found', 401);
            return;
        }

        const withdrawal = await walletService.updateWithdrawalStatus(
            withdrawalId,
            action,
            adminId,
            notes,
            transactionReference
        );

        await adminService.writeAdminAuditLog({
            actorId: adminId,
            scope: 'withdrawals.write',
            action: 'withdrawal.status.update',
            resourceType: 'withdrawal',
            resourceId: withdrawalId,
            reason: notes,
            metadata: { action, transactionReference },
        });

        sendSuccess(res, { withdrawal });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Withdrawal request not found') {
                sendError(res, error.message, 404);
                return;
            }
            sendError(res, error.message, 400);
            return;
        }
        sendError(res, 'Failed to update withdrawal status', 500);
    }
};

export const getAdminMessageConversations = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await adminService.listAdminConversations({
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
            status: req.query.status as 'normal' | 'locked' | undefined,
            missionId: typeof req.query.missionId === 'string' ? req.query.missionId : undefined,
            participantId: typeof req.query.participantId === 'string' ? req.query.participantId : undefined,
            dateFrom: typeof req.query.dateFrom === 'string' ? req.query.dateFrom : undefined,
            dateTo: typeof req.query.dateTo === 'string' ? req.query.dateTo : undefined,
            limit: parseIntQuery(req.query.limit, 25),
            cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
        });

        await adminService.writeAdminAuditLog({
            actorId: req.user?.uid || 'unknown',
            scope: 'messages.read',
            action: 'messages.conversations.list',
            resourceType: 'conversation',
            metadata: { filters: req.query },
        });

        sendSuccess(res, result);
    } catch {
        sendError(res, 'Failed to get admin conversations', 500);
    }
};

export const getAdminConversationMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { conversationId } = req.params;
        const result = await adminService.listAdminConversationMessages(conversationId, {
            limit: parseIntQuery(req.query.limit, 100),
            before: typeof req.query.before === 'string' ? req.query.before : undefined,
        });

        if (!result.conversation) {
            sendError(res, 'Conversation not found', 404);
            return;
        }

        await adminService.writeAdminAuditLog({
            actorId: req.user?.uid || 'unknown',
            scope: 'messages.read',
            action: 'messages.conversation.read',
            resourceType: 'conversation',
            resourceId: conversationId,
        });

        sendSuccess(res, result);
    } catch {
        sendError(res, 'Failed to get conversation messages', 500);
    }
};

export const moderateConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { conversationId } = req.params;
        const actorId = req.user?.uid;
        if (!actorId) {
            sendError(res, 'Authentication required', 401);
            return;
        }

        const { action, reason } = req.body as {
            action: 'lock' | 'unlock';
            reason: string;
        };

        const conversation = await adminService.moderateConversation({
            conversationId,
            action,
            reason,
            actorId,
        });

        if (!conversation) {
            sendError(res, 'Conversation not found', 404);
            return;
        }

        await adminService.writeAdminAuditLog({
            actorId,
            scope: 'messages.moderate',
            action: `conversation.${action}`,
            resourceType: 'conversation',
            resourceId: conversationId,
            reason,
        });

        sendSuccess(res, { conversation });
    } catch {
        sendError(res, 'Failed to moderate conversation', 500);
    }
};

export const moderateMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { conversationId, messageId } = req.params;
        const actorId = req.user?.uid;
        if (!actorId) {
            sendError(res, 'Authentication required', 401);
            return;
        }

        const { action, reason } = req.body as {
            action: 'hide' | 'restore';
            reason: string;
        };

        const message = await adminService.moderateMessage({
            conversationId,
            messageId,
            action,
            reason,
            actorId,
        });

        if (!message) {
            sendError(res, 'Message not found', 404);
            return;
        }

        await adminService.writeAdminAuditLog({
            actorId,
            scope: 'messages.moderate',
            action: `message.${action}`,
            resourceType: 'message',
            resourceId: messageId,
            reason,
            metadata: { conversationId },
        });

        sendSuccess(res, { message });
    } catch {
        sendError(res, 'Failed to moderate message', 500);
    }
};

export const getAdminPaymentIntents = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await adminService.listAdminPaymentIntents({
            provider: req.query.provider as 'stripe' | 'razorpay' | undefined,
            status: req.query.status as 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'cancelled' | undefined,
            missionId: typeof req.query.missionId === 'string' ? req.query.missionId : undefined,
            initiatorId: typeof req.query.initiatorId === 'string' ? req.query.initiatorId : undefined,
            limit: parseIntQuery(req.query.limit, 30),
            cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
        });
        sendSuccess(res, result);
    } catch {
        sendError(res, 'Failed to get payment intents', 500);
    }
};

export const getAdminEscrowAccounts = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await adminService.listAdminEscrowAccounts({
            status: req.query.status as MissionEscrowStatus | undefined,
            missionId: typeof req.query.missionId === 'string' ? req.query.missionId : undefined,
            initiatorId: typeof req.query.initiatorId === 'string' ? req.query.initiatorId : undefined,
            limit: parseIntQuery(req.query.limit, 30),
            cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
        });
        sendSuccess(res, result);
    } catch {
        sendError(res, 'Failed to get escrow accounts', 500);
    }
};

type MissionEscrowStatus = 'pending_funding' | 'funded' | 'partially_released' | 'completed' | 'disputed' | 'refunded';

export const getAdminAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await adminService.listAdminAuditLogs({
            actorId: typeof req.query.actorId === 'string' ? req.query.actorId : undefined,
            scope: typeof req.query.scope === 'string' ? req.query.scope : undefined,
            action: typeof req.query.action === 'string' ? req.query.action : undefined,
            resourceType: typeof req.query.resourceType === 'string' ? req.query.resourceType : undefined,
            resourceId: typeof req.query.resourceId === 'string' ? req.query.resourceId : undefined,
            dateFrom: typeof req.query.dateFrom === 'string' ? req.query.dateFrom : undefined,
            dateTo: typeof req.query.dateTo === 'string' ? req.query.dateTo : undefined,
            limit: parseIntQuery(req.query.limit, 50),
            cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
        });
        sendSuccess(res, result);
    } catch {
        sendError(res, 'Failed to get audit logs', 500);
    }
};

export const bootstrapAdminProfiles = async (_req: Request, res: Response): Promise<void> => {
    try {
        const result = await adminService.bootstrapAdminProfiles();
        sendSuccess(res, result);
    } catch {
        sendError(res, 'Failed to bootstrap admin profiles', 500);
    }
};
