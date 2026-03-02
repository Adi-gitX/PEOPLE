import crypto from 'crypto';
import { db } from '../../config/firebase.js';
import { env } from '../../config/env.js';
import {
    createSupportAcknowledgementEmail,
    createSupportInboxNotificationEmail,
    createSupportReplyEmail,
    sendEmail,
    type SendResult,
} from '../../services/email.js';

const SUPPORT_TICKETS_COLLECTION = 'supportTickets';
const SUPPORT_TICKET_EVENTS_COLLECTION = 'supportTicketEvents';
const EMAIL_OUTBOX_COLLECTION = 'emailOutbox';

const DEFAULT_OUTBOX_MAX_ATTEMPTS = 5;
const DEFAULT_OUTBOX_BASE_DELAY_MS = 30_000;

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SupportTicketCategory = 'general' | 'technical' | 'billing' | 'account' | 'safety' | 'other';

type OutboxStatus = 'pending' | 'retrying' | 'processing' | 'sent' | 'failed';

interface FirestoreTimestampLike {
    toDate: () => Date;
}

export interface SupportTicket {
    id: string;
    ticketRef: string;
    requesterName: string;
    requesterEmail: string;
    subject: string;
    message: string;
    category: SupportTicketCategory;
    priority: SupportTicketPriority;
    status: SupportTicketStatus;
    source: string;
    requesterUserId?: string;
    createdAt: Date;
    updatedAt: Date;
    lastResponseAt?: Date | null;
    assignedTo?: string | null;
    metadata: {
        ipHash: string | null;
        userAgent: string | null;
        honeypotTriggered?: boolean;
    };
}

export interface SupportTicketEvent {
    id: string;
    ticketId: string;
    actorType: 'system' | 'requester' | 'admin';
    actorId: string;
    eventType:
    | 'ticket_created'
    | 'ticket_updated'
    | 'admin_reply'
    | 'status_changed'
    | 'priority_changed'
    | 'honeypot_flagged';
    notes?: string;
    createdAt: Date;
}

interface EmailOutboxItem {
    id: string;
    kind: 'support_ticket_notify' | 'support_ticket_ack' | 'support_ticket_reply';
    to: string;
    subject: string;
    html: string;
    text: string;
    replyTo?: string;
    status: OutboxStatus;
    attempts: number;
    maxAttempts: number;
    nextAttemptAt: Date;
    lastError?: string;
    failureHistory?: string[];
    provider?: string;
    providerMessageId?: string;
    createdAt: Date;
    updatedAt: Date;
    sentAt?: Date;
    ticketId: string;
}

export interface CreateSupportTicketInput {
    name: string;
    email: string;
    subject: string;
    message: string;
    category?: SupportTicketCategory;
    priority?: SupportTicketPriority;
    source?: string;
    website?: string;
}

export interface CreateSupportTicketContext {
    requesterUserId?: string;
    ip?: string;
    userAgent?: string;
}

export interface CreateSupportTicketResult {
    ticketId: string;
    ticketRef: string;
    queuedEmails: number;
    status: SupportTicketStatus;
}

interface ListSupportTicketsOptions {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    category?: SupportTicketCategory;
    limit?: number;
    cursor?: string;
}

interface UpdateSupportTicketInput {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
}

interface ReplyToSupportTicketInput {
    message: string;
    adminId: string;
}

export interface ListSupportTicketsResult {
    tickets: SupportTicket[];
    nextCursor: string | null;
}

export interface SupportTicketDetail {
    ticket: SupportTicket;
    events: SupportTicketEvent[];
    delivery: {
        total: number;
        sent: number;
        pending: number;
        retrying: number;
        failed: number;
        items: EmailOutboxItem[];
    };
}

export interface ProcessOutboxResult {
    picked: number;
    sent: number;
    retried: number;
    failed: number;
    skipped: number;
}

const toDate = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
        const candidate = value as FirestoreTimestampLike;
        const converted = candidate.toDate();
        return converted instanceof Date ? converted : null;
    }
    return null;
};

const sanitizeText = (value: string, max: number): string => {
    return value.trim().replace(/\s+/g, ' ').slice(0, max);
};

const sanitizeMultilineText = (value: string, max: number): string => {
    return value.trim().slice(0, max);
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const hashIp = (ip?: string): string | null => {
    if (!ip) return null;
    return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24);
};

const derivePriority = (category: SupportTicketCategory): SupportTicketPriority => {
    if (category === 'billing' || category === 'safety') return 'high';
    if (category === 'technical') return 'normal';
    return 'low';
};

const nowYmd = (): string => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = `${now.getUTCMonth() + 1}`.padStart(2, '0');
    const d = `${now.getUTCDate()}`.padStart(2, '0');
    return `${y}${m}${d}`;
};

const generateTicketRef = (): string => {
    const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `SUP-${nowYmd()}-${suffix}`;
};

const getOutboxMaxAttempts = (): number => {
    const configured = env.SUPPORT_OUTBOX_MAX_ATTEMPTS;
    return Number.isFinite(configured) && configured > 0
        ? configured
        : DEFAULT_OUTBOX_MAX_ATTEMPTS;
};

const getOutboxBaseDelayMs = (): number => {
    const configured = env.SUPPORT_OUTBOX_BASE_DELAY_MS;
    return Number.isFinite(configured) && configured > 0
        ? configured
        : DEFAULT_OUTBOX_BASE_DELAY_MS;
};

const toSupportTicket = (id: string, raw: FirebaseFirestore.DocumentData): SupportTicket => {
    return {
        id,
        ticketRef: raw.ticketRef || id,
        requesterName: raw.requesterName || '',
        requesterEmail: raw.requesterEmail || '',
        subject: raw.subject || '',
        message: raw.message || '',
        category: (raw.category || 'general') as SupportTicketCategory,
        priority: (raw.priority || 'normal') as SupportTicketPriority,
        status: (raw.status || 'open') as SupportTicketStatus,
        source: raw.source || 'contact_form',
        requesterUserId: raw.requesterUserId || undefined,
        createdAt: toDate(raw.createdAt) || new Date(0),
        updatedAt: toDate(raw.updatedAt) || new Date(0),
        lastResponseAt: toDate(raw.lastResponseAt),
        assignedTo: raw.assignedTo || null,
        metadata: {
            ipHash: raw.metadata?.ipHash || null,
            userAgent: raw.metadata?.userAgent || null,
            honeypotTriggered: Boolean(raw.metadata?.honeypotTriggered),
        },
    };
};

const toSupportTicketEvent = (id: string, raw: FirebaseFirestore.DocumentData): SupportTicketEvent => {
    return {
        id,
        ticketId: raw.ticketId,
        actorType: raw.actorType,
        actorId: raw.actorId,
        eventType: raw.eventType,
        notes: raw.notes,
        createdAt: toDate(raw.createdAt) || new Date(0),
    };
};

const toOutboxItem = (id: string, raw: FirebaseFirestore.DocumentData): EmailOutboxItem => {
    return {
        id,
        kind: raw.kind,
        to: raw.to,
        subject: raw.subject,
        html: raw.html,
        text: raw.text,
        replyTo: raw.replyTo,
        status: (raw.status || 'pending') as OutboxStatus,
        attempts: Number(raw.attempts || 0),
        maxAttempts: Number(raw.maxAttempts || getOutboxMaxAttempts()),
        nextAttemptAt: toDate(raw.nextAttemptAt) || new Date(),
        lastError: raw.lastError,
        failureHistory: Array.isArray(raw.failureHistory) ? raw.failureHistory : [],
        provider: raw.provider,
        providerMessageId: raw.providerMessageId,
        createdAt: toDate(raw.createdAt) || new Date(0),
        updatedAt: toDate(raw.updatedAt) || new Date(0),
        sentAt: toDate(raw.sentAt) || undefined,
        ticketId: raw.ticketId,
    };
};

const createOutboxBase = (now: Date, ticketId: string) => ({
    status: 'pending' as OutboxStatus,
    attempts: 0,
    maxAttempts: getOutboxMaxAttempts(),
    nextAttemptAt: now,
    createdAt: now,
    updatedAt: now,
    ticketId,
});

const attachReplyToIfPresent = <T extends Record<string, unknown>>(payload: T, replyTo?: string): T => {
    if (replyTo) {
        return { ...payload, replyTo };
    }
    return payload;
};

export const createSupportTicket = async (
    input: CreateSupportTicketInput,
    context: CreateSupportTicketContext = {}
): Promise<CreateSupportTicketResult> => {
    const now = new Date();
    const ticketRef = generateTicketRef();
    const ticketRefDoc = db.collection(SUPPORT_TICKETS_COLLECTION).doc();
    const eventRef = db.collection(SUPPORT_TICKET_EVENTS_COLLECTION).doc();
    const source = input.source?.trim() || 'contact_form';
    const category = input.category || 'general';
    const priority = input.priority || derivePriority(category);
    const requesterName = sanitizeText(input.name, 100);
    const requesterEmail = normalizeEmail(input.email);
    const subject = sanitizeText(input.subject, 200);
    const message = sanitizeMultilineText(input.message, 5000);
    const honeypotTriggered = Boolean(input.website && input.website.trim());

    const supportNotify = createSupportInboxNotificationEmail({
        ticketRef,
        requesterName,
        requesterEmail,
        subject,
        message,
        category,
        priority,
    });

    const supportAck = createSupportAcknowledgementEmail({
        ticketRef,
        requesterName,
        subject,
        message,
    });

    const queuedOutbox = honeypotTriggered
        ? []
        : [
            ...(env.SUPPORT_INBOX_EMAIL
                ? [attachReplyToIfPresent({
                    ...createOutboxBase(now, ticketRefDoc.id),
                    kind: 'support_ticket_notify' as const,
                    to: env.SUPPORT_INBOX_EMAIL,
                    subject: supportNotify.subject,
                    html: supportNotify.html,
                    text: supportNotify.text,
                }, env.SUPPORT_REPLY_TO || requesterEmail)]
                : []),
            attachReplyToIfPresent({
                ...createOutboxBase(now, ticketRefDoc.id),
                kind: 'support_ticket_ack' as const,
                to: requesterEmail,
                subject: supportAck.subject,
                html: supportAck.html,
                text: supportAck.text,
            }, env.SUPPORT_REPLY_TO || env.SUPPORT_INBOX_EMAIL || env.SMTP_FROM_EMAIL),
        ];

    await db.runTransaction(async (transaction) => {
        const ticketEvent: Record<string, unknown> = {
            ticketId: ticketRefDoc.id,
            actorType: honeypotTriggered ? 'system' : 'requester',
            actorId: context.requesterUserId || 'public',
            eventType: honeypotTriggered ? 'honeypot_flagged' : 'ticket_created',
            createdAt: now,
        };
        if (honeypotTriggered) {
            ticketEvent.notes = 'Submission flagged by honeypot field';
        }

        transaction.set(ticketRefDoc, {
            ticketRef,
            requesterName,
            requesterEmail,
            subject,
            message,
            category,
            priority,
            status: honeypotTriggered ? 'closed' : 'open',
            source,
            requesterUserId: context.requesterUserId || null,
            createdAt: now,
            updatedAt: now,
            lastResponseAt: null,
            assignedTo: null,
            metadata: {
                ipHash: hashIp(context.ip),
                userAgent: context.userAgent?.slice(0, 500) || null,
                honeypotTriggered,
            },
        });

        transaction.set(eventRef, ticketEvent);

        queuedOutbox.forEach((item) => {
            const outboxRef = db.collection(EMAIL_OUTBOX_COLLECTION).doc();
            transaction.set(outboxRef, item);
        });
    });

    return {
        ticketId: ticketRefDoc.id,
        ticketRef,
        queuedEmails: queuedOutbox.length,
        status: honeypotTriggered ? 'closed' : 'open',
    };
};

export const listSupportTickets = async (
    options: ListSupportTicketsOptions
): Promise<ListSupportTicketsResult> => {
    const limit = Math.min(Math.max(options.limit || 20, 1), 100);
    let query = db.collection(SUPPORT_TICKETS_COLLECTION).orderBy('createdAt', 'desc').limit(limit * 4);

    if (options.cursor) {
        const cursorDoc = await db.collection(SUPPORT_TICKETS_COLLECTION).doc(options.cursor).get();
        if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
        }
    }

    const snapshot = await query.get();
    const tickets = snapshot.docs
        .map((doc) => toSupportTicket(doc.id, doc.data()))
        .filter((ticket) => {
            if (options.status && ticket.status !== options.status) return false;
            if (options.priority && ticket.priority !== options.priority) return false;
            if (options.category && ticket.category !== options.category) return false;
            return true;
        })
        .slice(0, limit);

    const nextCursor = tickets.length > 0 ? tickets[tickets.length - 1].id : null;

    return { tickets, nextCursor };
};

export const getSupportTicketDetail = async (ticketId: string): Promise<SupportTicketDetail | null> => {
    const ticketDoc = await db.collection(SUPPORT_TICKETS_COLLECTION).doc(ticketId).get();
    if (!ticketDoc.exists) return null;

    const [eventsSnap, outboxSnap] = await Promise.all([
        db.collection(SUPPORT_TICKET_EVENTS_COLLECTION).where('ticketId', '==', ticketId).limit(200).get(),
        db.collection(EMAIL_OUTBOX_COLLECTION).where('ticketId', '==', ticketId).limit(200).get(),
    ]);

    const events = eventsSnap.docs
        .map((doc) => toSupportTicketEvent(doc.id, doc.data()))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const items = outboxSnap.docs
        .map((doc) => toOutboxItem(doc.id, doc.data()))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const delivery = {
        total: items.length,
        sent: items.filter((item) => item.status === 'sent').length,
        pending: items.filter((item) => item.status === 'pending').length,
        retrying: items.filter((item) => item.status === 'retrying').length,
        failed: items.filter((item) => item.status === 'failed').length,
        items,
    };

    return {
        ticket: toSupportTicket(ticketDoc.id, ticketDoc.data() || {}),
        events,
        delivery,
    };
};

export const updateSupportTicket = async (
    ticketId: string,
    adminId: string,
    input: UpdateSupportTicketInput
): Promise<SupportTicket | null> => {
    const ticketRef = db.collection(SUPPORT_TICKETS_COLLECTION).doc(ticketId);
    const eventRef = db.collection(SUPPORT_TICKET_EVENTS_COLLECTION).doc();
    const now = new Date();

    const updated = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ticketRef);
        if (!snapshot.exists) return null;

        const current = toSupportTicket(snapshot.id, snapshot.data() || {});
        const updateData: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
            updatedAt: now,
        };
        const eventNotes: string[] = [];

        if (input.status && input.status !== current.status) {
            updateData.status = input.status;
            eventNotes.push(`status:${current.status}->${input.status}`);
        }

        if (input.priority && input.priority !== current.priority) {
            updateData.priority = input.priority;
            eventNotes.push(`priority:${current.priority}->${input.priority}`);
        }

        transaction.update(ticketRef, updateData);

        if (eventNotes.length > 0) {
            transaction.set(eventRef, {
                ticketId,
                actorType: 'admin',
                actorId: adminId,
                eventType: 'ticket_updated',
                notes: eventNotes.join(', '),
                createdAt: now,
            });
        }

        return {
            ...current,
            ...updateData,
            status: (updateData.status as SupportTicketStatus | undefined) || current.status,
            priority: (updateData.priority as SupportTicketPriority | undefined) || current.priority,
            updatedAt: now,
        } as SupportTicket;
    });

    return updated;
};

export const replyToSupportTicket = async (
    ticketId: string,
    input: ReplyToSupportTicketInput
): Promise<boolean> => {
    const ticketRef = db.collection(SUPPORT_TICKETS_COLLECTION).doc(ticketId);
    const eventRef = db.collection(SUPPORT_TICKET_EVENTS_COLLECTION).doc();
    const outboxRef = db.collection(EMAIL_OUTBOX_COLLECTION).doc();
    const now = new Date();
    const message = sanitizeMultilineText(input.message, 5000);

    return db.runTransaction(async (transaction) => {
        const ticketSnapshot = await transaction.get(ticketRef);
        if (!ticketSnapshot.exists) return false;
        const ticket = toSupportTicket(ticketSnapshot.id, ticketSnapshot.data() || {});

        const replyEmail = createSupportReplyEmail({
            ticketRef: ticket.ticketRef,
            requesterName: ticket.requesterName,
            originalSubject: ticket.subject,
            message,
        });

        transaction.update(ticketRef, {
            status: ticket.status === 'open' ? 'in_progress' : ticket.status,
            updatedAt: now,
            lastResponseAt: now,
        });

        transaction.set(eventRef, {
            ticketId,
            actorType: 'admin',
            actorId: input.adminId,
            eventType: 'admin_reply',
            notes: message,
            createdAt: now,
        });

        transaction.set(outboxRef, attachReplyToIfPresent({
            ...createOutboxBase(now, ticketId),
            kind: 'support_ticket_reply',
            to: ticket.requesterEmail,
            subject: replyEmail.subject,
            html: replyEmail.html,
            text: replyEmail.text,
        }, env.SUPPORT_REPLY_TO || env.SUPPORT_INBOX_EMAIL || env.SMTP_FROM_EMAIL));

        return true;
    });
};

const calculateNextAttemptAt = (attempt: number): Date => {
    const delay = Math.min(getOutboxBaseDelayMs() * Math.pow(2, Math.max(0, attempt - 1)), 60 * 60 * 1000);
    return new Date(Date.now() + delay);
};

const claimOutboxItem = async (itemId: string): Promise<EmailOutboxItem | null> => {
    const ref = db.collection(EMAIL_OUTBOX_COLLECTION).doc(itemId);
    const now = new Date();
    let claimed: EmailOutboxItem | null = null;

    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) return;

        const current = toOutboxItem(snapshot.id, snapshot.data() || {});
        if (!['pending', 'retrying'].includes(current.status)) return;
        if (current.nextAttemptAt.getTime() > now.getTime()) return;

        transaction.update(ref, {
            status: 'processing',
            updatedAt: now,
        });
        claimed = {
            ...current,
            status: 'processing',
            updatedAt: now,
        };
    });

    return claimed;
};

const persistOutboxSuccess = async (item: EmailOutboxItem, result: SendResult): Promise<void> => {
    const now = new Date();
    await db.collection(EMAIL_OUTBOX_COLLECTION).doc(item.id).update({
        status: 'sent',
        attempts: item.attempts + 1,
        provider: result.provider || 'smtp',
        providerMessageId: result.messageId || null,
        sentAt: now,
        updatedAt: now,
        lastError: null,
    });
};

const persistOutboxFailure = async (item: EmailOutboxItem, error: Error): Promise<'retrying' | 'failed'> => {
    const now = new Date();
    const attempts = item.attempts + 1;
    const maxAttempts = item.maxAttempts || getOutboxMaxAttempts();
    const lastError = error.message.slice(0, 1000);
    const failureHistory = [...(item.failureHistory || []), `${now.toISOString()}: ${lastError}`].slice(-20);

    if (attempts >= maxAttempts) {
        await db.collection(EMAIL_OUTBOX_COLLECTION).doc(item.id).update({
            status: 'failed',
            attempts,
            updatedAt: now,
            lastError,
            failureHistory,
        });
        return 'failed';
    }

    await db.collection(EMAIL_OUTBOX_COLLECTION).doc(item.id).update({
        status: 'retrying',
        attempts,
        updatedAt: now,
        nextAttemptAt: calculateNextAttemptAt(attempts),
        lastError,
        failureHistory,
    });
    return 'retrying';
};

export const processDueOutboxJobs = async (limit: number = 10): Promise<ProcessOutboxResult> => {
    const now = new Date();
    const boundedLimit = Math.min(Math.max(limit, 1), 50);
    const snapshot = await db
        .collection(EMAIL_OUTBOX_COLLECTION)
        .where('nextAttemptAt', '<=', now)
        .orderBy('nextAttemptAt', 'asc')
        .limit(boundedLimit * 3)
        .get();

    const candidates = snapshot.docs
        .map((doc) => toOutboxItem(doc.id, doc.data()))
        .filter((item) => item.status === 'pending' || item.status === 'retrying')
        .slice(0, boundedLimit);

    const result: ProcessOutboxResult = {
        picked: candidates.length,
        sent: 0,
        retried: 0,
        failed: 0,
        skipped: 0,
    };

    for (const candidate of candidates) {
        const claimed = await claimOutboxItem(candidate.id);
        if (!claimed) {
            result.skipped += 1;
            continue;
        }

        try {
            const sendResult = await sendEmail(
                claimed.to,
                claimed.subject,
                claimed.html,
                { text: claimed.text, replyTo: claimed.replyTo }
            );

            if (!sendResult.success) {
                throw new Error(sendResult.error || 'SMTP delivery failed');
            }

            await persistOutboxSuccess(claimed, sendResult);
            result.sent += 1;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown SMTP error');
            const state = await persistOutboxFailure(claimed, err);
            if (state === 'retrying') result.retried += 1;
            if (state === 'failed') result.failed += 1;
        }
    }

    return result;
};
