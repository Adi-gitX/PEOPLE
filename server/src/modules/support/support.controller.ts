import { Request, Response } from 'express';
import {
    createSupportTicket,
    getSupportTicketDetail,
    listSupportTickets,
    processDueOutboxJobs,
    replyToSupportTicket,
    updateSupportTicket,
} from './support.service.js';
import { sendError, sendSuccess } from '../../utils/response.js';
import { writeAdminAuditLog } from '../admin/admin.service.js';

const parseLimit = (value: unknown, fallback: number): number => {
    if (typeof value !== 'string') return fallback;
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return parsed;
};

export const createTicket = async (req: Request, res: Response): Promise<void> => {
    try {
        const payload = req.body as {
            name: string;
            email: string;
            subject: string;
            message: string;
            category?: 'general' | 'technical' | 'billing' | 'account' | 'safety' | 'other';
            priority?: 'low' | 'normal' | 'high' | 'urgent';
            source?: string;
            website?: string;
        };

        const ticket = await createSupportTicket(payload, {
            requesterUserId: req.user?.uid,
            ip: req.ip,
            userAgent: req.get('user-agent') || undefined,
        });

        sendSuccess(
            res,
            {
                message: 'Support request received. We will reply soon.',
                ticketRef: ticket.ticketRef,
                queuedEmails: ticket.queuedEmails,
                status: ticket.status,
            },
            202
        );
    } catch (error) {
        if (error instanceof Error) {
            sendError(res, error.message, 400);
            return;
        }
        sendError(res, 'Failed to submit support request', 500);
    }
};

export const getAdminTickets = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await listSupportTickets({
            status: req.query.status as 'open' | 'in_progress' | 'resolved' | 'closed' | undefined,
            priority: req.query.priority as 'low' | 'normal' | 'high' | 'urgent' | undefined,
            category: req.query.category as 'general' | 'technical' | 'billing' | 'account' | 'safety' | 'other' | undefined,
            limit: parseLimit(req.query.limit, 20),
            cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
        });
        sendSuccess(res, result);
    } catch (error) {
        if (error instanceof Error) {
            sendError(res, error.message, 400);
            return;
        }
        sendError(res, 'Failed to get support tickets', 500);
    }
};

export const getAdminTicketDetail = async (req: Request, res: Response): Promise<void> => {
    try {
        const detail = await getSupportTicketDetail(req.params.ticketId);
        if (!detail) {
            sendError(res, 'Support ticket not found', 404);
            return;
        }
        sendSuccess(res, detail);
    } catch {
        sendError(res, 'Failed to get support ticket', 500);
    }
};

export const patchAdminTicket = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.user?.uid;
        if (!adminId) {
            sendError(res, 'Authentication required', 401);
            return;
        }

        const updated = await updateSupportTicket(req.params.ticketId, adminId, req.body);
        if (!updated) {
            sendError(res, 'Support ticket not found', 404);
            return;
        }

        await writeAdminAuditLog({
            actorId: adminId,
            scope: 'support.write',
            action: 'support.ticket.update',
            resourceType: 'supportTicket',
            resourceId: req.params.ticketId,
            reason: req.body?.status || req.body?.priority,
            metadata: { patch: req.body },
        });

        sendSuccess(res, { ticket: updated });
    } catch (error) {
        if (error instanceof Error) {
            sendError(res, error.message, 400);
            return;
        }
        sendError(res, 'Failed to update support ticket', 500);
    }
};

export const postAdminReply = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.user?.uid;
        if (!adminId) {
            sendError(res, 'Authentication required', 401);
            return;
        }

        const ok = await replyToSupportTicket(req.params.ticketId, {
            adminId,
            message: req.body.message,
        });

        if (!ok) {
            sendError(res, 'Support ticket not found', 404);
            return;
        }

        await writeAdminAuditLog({
            actorId: adminId,
            scope: 'support.reply',
            action: 'support.ticket.reply',
            resourceType: 'supportTicket',
            resourceId: req.params.ticketId,
            reason: 'Admin reply queued',
        });

        sendSuccess(res, { message: 'Reply queued for delivery' }, 202);
    } catch (error) {
        if (error instanceof Error) {
            sendError(res, error.message, 400);
            return;
        }
        sendError(res, 'Failed to reply to support ticket', 500);
    }
};

export const processOutboxNow = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = parseLimit(req.body?.limit, 10);
        const result = await processDueOutboxJobs(limit);
        sendSuccess(res, result);
    } catch {
        sendError(res, 'Failed to process support outbox', 500);
    }
};
