import { Router, Request, Response, NextFunction } from 'express';
import * as adminController from './admin.controller.js';
import * as supportController from '../support/support.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin, requireAdminScope } from '../../middleware/admin.js';
import { adminMutationLimiter } from '../../middleware/rateLimit.js';
import { env } from '../../config/env.js';
import { validate } from '../../middleware/validate.js';
import {
    adminAuditLogsQuerySchema,
    adminConversationModerationSchema,
    adminEscrowAccountsQuerySchema,
    adminMessageModerationSchema,
    adminMessagesConversationQuerySchema,
    adminMessagesQuerySchema,
    adminPaymentsIntentQuerySchema,
    adminWithdrawalsQuerySchema,
    supportReplySchema,
    supportTicketsQuerySchema,
    updateSupportTicketSchema,
} from '../../schemas/index.js';
import { z } from 'zod';

const router = Router();

const requireFeature = (enabled: boolean) => {
    return (_req: Request, res: Response, next: NextFunction): void => {
        if (!enabled) {
            res.status(404).json({
                success: false,
                error: 'Feature not enabled',
            });
            return;
        }
        next();
    };
};

router.use(requireAuth);
router.use(requireAdmin);

router.get('/me/scopes', adminController.getMyAdminScopes);

router.get('/stats', requireAdminScope(['users.read']), adminController.getPlatformStats);

router.get('/users', requireAdminScope(['users.read']), adminController.getAllUsers);

router.patch(
    '/users/:userId/status',
    requireAdminScope(['users.write']),
    adminMutationLimiter,
    validate(z.object({
        status: z.enum(['active', 'suspended', 'banned', 'pending_verification']),
    })),
    adminController.updateUserStatus
);

router.patch(
    '/users/:userId/verify',
    requireAdminScope(['users.write']),
    adminMutationLimiter,
    adminController.verifyUser
);

router.get('/missions', requireAdminScope(['missions.read']), adminController.getAllMissions);

router.patch(
    '/missions/:missionId/cancel',
    requireAdminScope(['missions.write']),
    adminMutationLimiter,
    adminController.cancelMission
);

router.get('/disputes', requireAdminScope(['disputes.read']), adminController.getDisputes);

router.patch(
    '/disputes/:disputeId/resolve',
    requireAdminScope(['disputes.resolve']),
    adminMutationLimiter,
    validate(z.object({
        resolution: z.string().min(1),
        favoredParty: z.enum(['initiator', 'contributor']),
    })),
    adminController.resolveDispute
);

router.get(
    '/withdrawals',
    requireAdminScope(['withdrawals.read']),
    validate(adminWithdrawalsQuerySchema, 'query'),
    adminController.getWithdrawals
);

router.patch(
    '/withdrawals/:withdrawalId',
    requireAdminScope(['withdrawals.write']),
    adminMutationLimiter,
    validate(z.object({
        action: z.enum(['approve', 'reject', 'mark_paid']),
        notes: z.string().optional(),
        transactionReference: z.string().optional(),
    })),
    adminController.updateWithdrawalStatus
);

router.get(
    '/payments/intents',
    requireFeature(env.ADMIN_PAYMENTS_CONSOLE_ENABLED),
    requireAdminScope(['payments.read']),
    validate(adminPaymentsIntentQuerySchema, 'query'),
    adminController.getAdminPaymentIntents
);

router.get(
    '/escrow/accounts',
    requireAdminScope(['escrow.read']),
    validate(adminEscrowAccountsQuerySchema, 'query'),
    adminController.getAdminEscrowAccounts
);

router.get(
    '/audit-logs',
    requireFeature(env.ADMIN_AUDIT_ENABLED),
    requireAdminScope(['audit.read']),
    validate(adminAuditLogsQuerySchema, 'query'),
    adminController.getAdminAuditLogs
);

router.get(
    '/messages/conversations',
    requireFeature(env.ADMIN_MESSAGES_ENABLED),
    requireAdminScope(['messages.read']),
    validate(adminMessagesConversationQuerySchema, 'query'),
    adminController.getAdminMessageConversations
);

router.get(
    '/messages/conversations/:conversationId/messages',
    requireFeature(env.ADMIN_MESSAGES_ENABLED),
    requireAdminScope(['messages.read']),
    validate(adminMessagesQuerySchema, 'query'),
    adminController.getAdminConversationMessages
);

router.patch(
    '/messages/conversations/:conversationId/moderation',
    requireFeature(env.ADMIN_MESSAGES_ENABLED),
    requireAdminScope(['messages.moderate']),
    adminMutationLimiter,
    validate(adminConversationModerationSchema),
    adminController.moderateConversation
);

router.patch(
    '/messages/conversations/:conversationId/messages/:messageId/moderation',
    requireFeature(env.ADMIN_MESSAGES_ENABLED),
    requireAdminScope(['messages.moderate']),
    adminMutationLimiter,
    validate(adminMessageModerationSchema),
    adminController.moderateMessage
);

router.get(
    '/support/tickets',
    requireAdminScope(['support.read']),
    validate(supportTicketsQuerySchema, 'query'),
    supportController.getAdminTickets
);

router.get(
    '/support/tickets/:ticketId',
    requireAdminScope(['support.read']),
    supportController.getAdminTicketDetail
);

router.patch(
    '/support/tickets/:ticketId',
    requireAdminScope(['support.write']),
    adminMutationLimiter,
    validate(updateSupportTicketSchema),
    supportController.patchAdminTicket
);

router.post(
    '/support/tickets/:ticketId/reply',
    requireAdminScope(['support.reply']),
    adminMutationLimiter,
    validate(supportReplySchema),
    supportController.postAdminReply
);

export default router;
