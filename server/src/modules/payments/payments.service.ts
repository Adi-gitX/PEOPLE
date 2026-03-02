import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import Stripe from 'stripe';
import { db } from '../../config/firebase.js';
import { env } from '../../config/env.js';
import type { EscrowAccount, EscrowTransaction, Mission } from '../../types/firestore.js';
import * as escrowService from '../escrow/escrow.service.js';
import * as walletService from '../wallet/wallet.service.js';

const MISSIONS_COLLECTION = 'missions';
const ESCROW_COLLECTION = 'escrowAccounts';
const ESCROW_TRANSACTIONS_COLLECTION = 'escrowTransactions';
const PAYMENT_INTENTS_COLLECTION = 'paymentIntents';
const WEBHOOK_EVENTS_COLLECTION = 'paymentWebhookEvents';

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

type PaymentProvider = 'stripe' | 'razorpay';
type PaymentIntentStatus = 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'cancelled';

export interface FundingIntentResponse {
    id: string;
    missionId: string;
    escrowId: string;
    provider: PaymentProvider;
    status: PaymentIntentStatus;
    amountMinor: number;
    currency: string;
    clientSecret?: string;
    orderId?: string;
    keyId?: string;
    publishableKey?: string;
    redirectUrl?: string;
}

interface StoredPaymentIntent {
    id?: string;
    missionId: string;
    escrowId: string;
    initiatorId: string;
    provider: PaymentProvider;
    status: PaymentIntentStatus;
    amountMinor: number;
    currency: string;
    idempotencyKey: string;
    providerIntentId?: string;
    providerOrderId?: string;
    providerPaymentId?: string;
    failureReason?: string;
    fundedAt?: Date;
    escrowAppliedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

interface StripeLikeEvent {
    id: string;
    type: string;
    data: {
        object: Record<string, unknown>;
    };
}

interface RazorpayPaymentEntity {
    id?: string;
    order_id?: string;
    amount?: number;
    currency?: string;
    error_description?: string;
}

interface RazorpayWebhookPayload {
    event?: string;
    payload?: {
        payment?: {
            entity?: RazorpayPaymentEntity;
        };
    };
}

export interface PaymentSummary {
    missionId: string;
    missionTitle: string;
    amount: number;
    status: 'pending' | 'held' | 'released' | 'refunded';
    createdAt: Date;
}

export interface WalletBalance {
    available: number;
    pending: number;
    total: number;
}

const toMinorUnits = (amount: number): number => Math.round(amount * 100);
const toMajorUnits = (amountMinor: number): number => amountMinor / 100;

const normalizeCurrency = (currency: string | undefined): string => {
    return (currency || 'USD').toUpperCase();
};

const normalizeWebhookBody = (payload: unknown): Buffer => {
    if (Buffer.isBuffer(payload)) return payload;
    if (typeof payload === 'string') return Buffer.from(payload);
    return Buffer.from(JSON.stringify(payload ?? {}));
};

const verifyRazorpaySignature = (rawBody: Buffer, signature: string | undefined): boolean => {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
        return true;
    }
    if (!signature) {
        return false;
    }

    const expected = createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest();

    const received = Buffer.from(signature, 'hex');
    if (expected.length !== received.length) {
        return false;
    }

    return timingSafeEqual(expected, received);
};

const getMission = async (missionId: string): Promise<(Mission & { id: string }) | null> => {
    const missionDoc = await db.collection(MISSIONS_COLLECTION).doc(missionId).get();
    if (!missionDoc.exists) return null;
    return { id: missionDoc.id, ...missionDoc.data() } as Mission & { id: string };
};

const ensureEscrowAccount = async (
    missionId: string,
    initiatorId: string,
    amountMajor: number,
    currency: string
): Promise<EscrowAccount> => {
    const existingEscrow = await escrowService.getEscrowAccountByMission(missionId);
    if (existingEscrow) {
        return existingEscrow;
    }

    return escrowService.createEscrowAccount(
        missionId,
        initiatorId,
        amountMajor,
        currency.toLowerCase()
    );
};

const chooseProvider = (provider: PaymentProvider | undefined, currency: string): PaymentProvider => {
    if (provider) {
        return provider;
    }

    if (currency === 'INR') {
        return env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET ? 'razorpay' : 'stripe';
    }

    return 'stripe';
};

const createRazorpayOrder = async (
    amountMinor: number,
    currency: string,
    receipt: string,
    notes: Record<string, string>
): Promise<{ id: string; amount: number; currency: string }> => {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay is not configured');
    }

    const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            amount: amountMinor,
            currency,
            receipt,
            notes,
            payment_capture: 1,
        }),
    });

    if (!response.ok) {
        const responseBody = await response.text();
        throw new Error(`Razorpay order creation failed: ${response.status} ${responseBody}`);
    }

    const order = await response.json() as { id: string; amount: number; currency: string };
    return order;
};

const getLatestMissionIntent = async (missionId: string): Promise<StoredPaymentIntent | null> => {
    const snapshot = await db
        .collection(PAYMENT_INTENTS_COLLECTION)
        .where('missionId', '==', missionId)
        .get();

    if (snapshot.empty) return null;
    const latestDoc = snapshot.docs
        .sort((a, b) => {
            const aDate = a.data().createdAt;
            const bDate = b.data().createdAt;
            const aTime = aDate instanceof Date ? aDate.getTime() : new Date(aDate?.seconds * 1000 || aDate).getTime();
            const bTime = bDate instanceof Date ? bDate.getTime() : new Date(bDate?.seconds * 1000 || bDate).getTime();
            return bTime - aTime;
        })[0];

    const doc = latestDoc;
    return { id: doc.id, ...doc.data() } as StoredPaymentIntent;
};

const recordWebhookEvent = async (
    provider: PaymentProvider,
    eventId: string,
    signatureVerified: boolean
): Promise<boolean> => {
    const id = `${provider}:${eventId}`;
    const eventRef = db.collection(WEBHOOK_EVENTS_COLLECTION).doc(id);
    const existing = await eventRef.get();

    if (existing.exists) {
        return false;
    }

    await eventRef.set({
        provider,
        eventId,
        signatureVerified,
        status: 'received',
        createdAt: new Date(),
        processedAt: null,
    });

    return true;
};

const updateWebhookEventStatus = async (
    provider: PaymentProvider,
    eventId: string,
    status: 'processed' | 'ignored' | 'failed',
    reason?: string
): Promise<void> => {
    const id = `${provider}:${eventId}`;
    await db.collection(WEBHOOK_EVENTS_COLLECTION).doc(id).set({
        status,
        reason,
        processedAt: new Date(),
    }, { merge: true });
};

const findIntentForProviderRef = async (
    provider: PaymentProvider,
    refs: { providerIntentId?: string; providerOrderId?: string; providerPaymentId?: string }
): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> => {
    const snapshot = await db
        .collection(PAYMENT_INTENTS_COLLECTION)
        .where('provider', '==', provider)
        .limit(200)
        .get();

    const lookupValues = provider === 'stripe'
        ? [refs.providerIntentId, refs.providerPaymentId]
        : [refs.providerOrderId, refs.providerPaymentId];

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const candidates = provider === 'stripe'
            ? [data.providerIntentId, data.providerPaymentId]
            : [data.providerOrderId, data.providerPaymentId];

        if (lookupValues.some((value) => value && candidates.includes(value))) {
            return doc;
        }
    }

    return null;
};

const applyFundingSuccess = async (
    provider: PaymentProvider,
    refs: { providerIntentId?: string; providerOrderId?: string; providerPaymentId?: string },
    amountMinor: number,
    currency: string
): Promise<boolean> => {
    const intentDoc = await findIntentForProviderRef(provider, refs);
    if (!intentDoc) {
        return false;
    }

    const intent = { id: intentDoc.id, ...intentDoc.data() } as StoredPaymentIntent;
    const now = new Date();

    if (intent.status === 'succeeded' && intent.escrowAppliedAt) {
        return true;
    }

    await intentDoc.ref.set({
        status: 'succeeded',
        amountMinor,
        currency,
        providerPaymentId: refs.providerPaymentId || intent.providerPaymentId,
        fundedAt: intent.fundedAt || now,
        updatedAt: now,
    }, { merge: true });

    if (intent.escrowAppliedAt) {
        return true;
    }

    const escrowDoc = await db.collection(ESCROW_COLLECTION).doc(intent.escrowId).get();
    if (!escrowDoc.exists) {
        return false;
    }

    const escrow = { id: escrowDoc.id, ...escrowDoc.data() } as EscrowAccount;
    const amountMajor = toMajorUnits(amountMinor);

    const stripePaymentIntentIds = new Set(escrow.stripePaymentIntentIds || []);
    if (provider === 'stripe' && refs.providerIntentId) {
        stripePaymentIntentIds.add(refs.providerIntentId);
    }

    await escrowDoc.ref.update({
        balance: (escrow.balance || 0) + amountMajor,
        totalFunded: (escrow.totalFunded || 0) + amountMajor,
        status: 'funded',
        fundedAt: escrow.fundedAt || now,
        stripePaymentIntentIds: Array.from(stripePaymentIntentIds),
        updatedAt: now,
    });

    await db.collection(ESCROW_TRANSACTIONS_COLLECTION).add({
        missionId: intent.missionId,
        initiatorId: intent.initiatorId,
        type: 'deposit',
        amount: amountMajor,
        currency: currency.toLowerCase(),
        stripePaymentIntentId: provider === 'stripe' ? refs.providerIntentId : undefined,
        status: 'completed',
        description: `Escrow funding (${provider})`,
        processedAt: now,
        createdAt: now,
        updatedAt: now,
    } as Omit<EscrowTransaction, 'id'>);

    const missionDoc = await db.collection(MISSIONS_COLLECTION).doc(intent.missionId).get();
    if (missionDoc.exists) {
        const missionData = missionDoc.data() as Mission;
        if (missionData.status === 'draft' || missionData.status === 'pending_funding') {
            await missionDoc.ref.update({
                status: 'open',
                updatedAt: now,
            });
        }
    }

    await intentDoc.ref.set({ escrowAppliedAt: now, updatedAt: now }, { merge: true });
    return true;
};

const applyFundingFailure = async (
    provider: PaymentProvider,
    refs: { providerIntentId?: string; providerOrderId?: string; providerPaymentId?: string },
    reason?: string
): Promise<boolean> => {
    const intentDoc = await findIntentForProviderRef(provider, refs);
    if (!intentDoc) {
        return false;
    }

    await intentDoc.ref.set({
        status: 'failed',
        failureReason: reason || 'Payment failed',
        updatedAt: new Date(),
    }, { merge: true });

    return true;
};

export const createEscrowFundingIntent = async (params: {
    missionId: string;
    initiatorId: string;
    actingUserRole?: 'initiator' | 'admin';
    amount?: number;
    provider?: PaymentProvider;
    currency?: string;
}): Promise<FundingIntentResponse> => {
    const mission = await getMission(params.missionId);
    if (!mission) {
        throw new Error('Mission not found');
    }

    const isAdmin = params.actingUserRole === 'admin';
    if (!isAdmin && mission.initiatorId !== params.initiatorId) {
        throw new Error('Not authorized to fund this mission');
    }

    const missionInitiatorId = mission.initiatorId;

    const amount = params.amount ?? mission.budgetMax ?? mission.budgetMin;
    if (!amount || amount <= 0) {
        throw new Error('Invalid funding amount');
    }

    const currency = normalizeCurrency(params.currency || 'USD');
    const provider = chooseProvider(params.provider, currency);
    const amountMinor = toMinorUnits(amount);

    const escrow = await ensureEscrowAccount(
        params.missionId,
        missionInitiatorId,
        amount,
        currency
    );

    const now = new Date();
    const idempotencyKey = randomUUID();

    const intent: StoredPaymentIntent = {
        missionId: params.missionId,
        escrowId: escrow.id || '',
        initiatorId: missionInitiatorId,
        provider,
        status: 'pending',
        amountMinor,
        currency,
        idempotencyKey,
        createdAt: now,
        updatedAt: now,
    };

    const response: FundingIntentResponse = {
        id: '',
        missionId: params.missionId,
        escrowId: escrow.id || '',
        provider,
        status: 'pending',
        amountMinor,
        currency,
    };

    if (provider === 'stripe' && stripe) {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountMinor,
            currency: currency.toLowerCase(),
            automatic_payment_methods: { enabled: true },
            metadata: {
                missionId: params.missionId,
                escrowId: escrow.id || '',
                initiatorId: missionInitiatorId,
                idempotencyKey,
            },
        });

        intent.providerIntentId = paymentIntent.id;
        intent.status = paymentIntent.status === 'succeeded' ? 'succeeded' : 'requires_action';

        response.clientSecret = paymentIntent.client_secret || undefined;
        response.publishableKey = undefined;
        response.status = intent.status;
    } else if (provider === 'razorpay') {
        const order = await createRazorpayOrder(
            amountMinor,
            currency,
            `mission-${params.missionId}-${Date.now()}`,
            {
                missionId: params.missionId,
                escrowId: escrow.id || '',
                initiatorId: missionInitiatorId,
                idempotencyKey,
            }
        );

        intent.providerOrderId = order.id;
        intent.status = 'requires_action';

        response.orderId = order.id;
        response.keyId = env.RAZORPAY_KEY_ID;
        response.status = intent.status;
    } else {
        intent.status = 'pending';
        response.status = 'pending';
    }

    const docRef = await db.collection(PAYMENT_INTENTS_COLLECTION).add(intent);
    response.id = docRef.id;

    if (mission.status === 'draft') {
        await db.collection(MISSIONS_COLLECTION).doc(params.missionId).update({
            status: 'pending_funding',
            updatedAt: new Date(),
        });
    }

    return response;
};

export const getMissionFundingStatus = async (missionId: string): Promise<{
    missionId: string;
    escrow: EscrowAccount | null;
    latestIntent: StoredPaymentIntent | null;
}> => {
    const [escrow, latestIntent] = await Promise.all([
        escrowService.getEscrowAccountByMission(missionId),
        getLatestMissionIntent(missionId),
    ]);

    return {
        missionId,
        escrow,
        latestIntent,
    };
};

export const createCheckoutSession = async (
    missionId: string,
    initiatorId: string,
    amount: number,
    successUrl: string,
    _cancelUrl: string,
    actingUserRole: 'initiator' | 'admin' = 'initiator'
): Promise<{ sessionUrl: string; fundingIntent: FundingIntentResponse }> => {
    const fundingIntent = await createEscrowFundingIntent({
        missionId,
        initiatorId,
        actingUserRole,
        amount,
        provider: 'stripe',
    });

    return {
        sessionUrl: successUrl,
        fundingIntent,
    };
};

export const getContributorBalance = async (contributorId: string): Promise<WalletBalance> => {
    const wallet = await walletService.getOrCreateWallet(contributorId);

    return {
        available: wallet.availableBalance,
        pending: wallet.pendingBalance,
        total: wallet.totalEarnings,
    };
};

export const getPaymentHistory = async (
    userId: string,
    role: 'contributor' | 'initiator'
): Promise<EscrowTransaction[]> => {
    const field = role === 'contributor' ? 'contributorId' : 'initiatorId';
    const snapshot = await db
        .collection(ESCROW_TRANSACTIONS_COLLECTION)
        .where(field, '==', userId)
        .get();

    const transactions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as EscrowTransaction));

    return transactions.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
        return dateB - dateA;
    });
};

export const getMissionPayments = async (missionId: string): Promise<EscrowTransaction[]> => {
    return escrowService.getTransactionsByMission(missionId);
};

export const releaseEscrow = async (
    missionId: string,
    requesterId: string,
    requesterRole: 'initiator' | 'admin',
    contributorId: string,
    amount: number
): Promise<{ transaction: EscrowTransaction; warning?: string }> => {
    const mission = await getMission(missionId);
    if (!mission) {
        throw new Error('Mission not found');
    }

    if (requesterRole !== 'admin' && mission.initiatorId !== requesterId) {
        throw new Error('Not authorized to release mission funds');
    }

    const escrow = await escrowService.getEscrowAccountByMission(missionId);
    if (!escrow || !escrow.id) {
        throw new Error('Escrow account not found for mission');
    }

    const result = await escrowService.releaseFunds(escrow.id, contributorId, amount, undefined, 'Escrow release');
    if (!result.success || !result.transaction) {
        throw new Error(result.error || 'Failed to release escrow');
    }

    return {
        transaction: result.transaction,
        warning: result.warning,
    };
};

export const handleStripeWebhook = async (
    payload: unknown,
    signatureHeader?: string
): Promise<{ processed: boolean; message: string }> => {
    const rawBody = normalizeWebhookBody(payload);

    let event: StripeLikeEvent;
    let signatureVerified = false;

    if (stripe && env.STRIPE_WEBHOOK_SECRET && signatureHeader) {
        const stripeEvent = stripe.webhooks.constructEvent(rawBody, signatureHeader, env.STRIPE_WEBHOOK_SECRET);
        event = {
            id: stripeEvent.id,
            type: stripeEvent.type,
            data: {
                object: stripeEvent.data.object as Record<string, unknown>,
            },
        };
        signatureVerified = true;
    } else {
        event = JSON.parse(rawBody.toString('utf8')) as StripeLikeEvent;
    }

    const shouldProcess = await recordWebhookEvent('stripe', event.id, signatureVerified);
    if (!shouldProcess) {
        return { processed: false, message: 'Duplicate webhook event ignored' };
    }

    try {
        if (event.type === 'payment_intent.succeeded') {
            const object = event.data.object;
            const providerIntentId = typeof object.id === 'string' ? object.id : undefined;
            const providerPaymentId = typeof object.latest_charge === 'string' ? object.latest_charge : undefined;
            const amountMinor = typeof object.amount_received === 'number'
                ? object.amount_received
                : typeof object.amount === 'number'
                    ? object.amount
                    : 0;
            const currency = normalizeCurrency(typeof object.currency === 'string' ? object.currency : 'USD');

            if (!providerIntentId || amountMinor <= 0) {
                await updateWebhookEventStatus('stripe', event.id, 'ignored', 'Missing intent id or amount');
                return { processed: false, message: 'Ignored webhook without payment intent details' };
            }

            const applied = await applyFundingSuccess(
                'stripe',
                { providerIntentId, providerPaymentId },
                amountMinor,
                currency
            );

            await updateWebhookEventStatus('stripe', event.id, applied ? 'processed' : 'ignored');
            return {
                processed: applied,
                message: applied ? 'Stripe funding processed' : 'No matching funding intent found',
            };
        }

        if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
            const object = event.data.object;
            const providerIntentId = typeof object.id === 'string' ? object.id : undefined;
            const reason = typeof object.last_payment_error === 'object' && object.last_payment_error
                ? String((object.last_payment_error as { message?: string }).message || 'Payment failed')
                : 'Payment failed';

            if (!providerIntentId) {
                await updateWebhookEventStatus('stripe', event.id, 'ignored', 'Missing payment intent id');
                return { processed: false, message: 'Ignored webhook without payment intent id' };
            }

            const applied = await applyFundingFailure('stripe', { providerIntentId }, reason);
            await updateWebhookEventStatus('stripe', event.id, applied ? 'processed' : 'ignored');
            return {
                processed: applied,
                message: applied ? 'Stripe failure status applied' : 'No matching funding intent found',
            };
        }

        await updateWebhookEventStatus('stripe', event.id, 'ignored', 'Unhandled event type');
        return { processed: false, message: `Unhandled event type: ${event.type}` };
    } catch (error) {
        await updateWebhookEventStatus('stripe', event.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
};

export const handleRazorpayWebhook = async (
    payload: unknown,
    signatureHeader?: string
): Promise<{ processed: boolean; message: string }> => {
    const rawBody = normalizeWebhookBody(payload);

    const signatureVerified = verifyRazorpaySignature(rawBody, signatureHeader);
    if (!signatureVerified) {
        throw new Error('Invalid Razorpay webhook signature');
    }

    const event = JSON.parse(rawBody.toString('utf8')) as RazorpayWebhookPayload;
    const eventId = createHmac('sha256', 'people-razorpay-webhook')
        .update(rawBody)
        .digest('hex');

    const shouldProcess = await recordWebhookEvent('razorpay', eventId, true);
    if (!shouldProcess) {
        return { processed: false, message: 'Duplicate webhook event ignored' };
    }

    try {
        const payment = event.payload?.payment?.entity;

        if (event.event === 'payment.captured') {
            const orderId = payment?.order_id;
            const paymentId = payment?.id;
            const amountMinor = payment?.amount || 0;
            const currency = normalizeCurrency(payment?.currency || 'INR');

            if (!orderId || !paymentId || amountMinor <= 0) {
                await updateWebhookEventStatus('razorpay', eventId, 'ignored', 'Missing payment identifiers');
                return { processed: false, message: 'Ignored webhook with incomplete payment details' };
            }

            const applied = await applyFundingSuccess(
                'razorpay',
                { providerOrderId: orderId, providerPaymentId: paymentId },
                amountMinor,
                currency
            );

            await updateWebhookEventStatus('razorpay', eventId, applied ? 'processed' : 'ignored');
            return {
                processed: applied,
                message: applied ? 'Razorpay funding processed' : 'No matching funding intent found',
            };
        }

        if (event.event === 'payment.failed') {
            const applied = await applyFundingFailure(
                'razorpay',
                { providerOrderId: payment?.order_id, providerPaymentId: payment?.id },
                payment?.error_description || 'Payment failed'
            );

            await updateWebhookEventStatus('razorpay', eventId, applied ? 'processed' : 'ignored');
            return {
                processed: applied,
                message: applied ? 'Razorpay failure status applied' : 'No matching funding intent found',
            };
        }

        await updateWebhookEventStatus('razorpay', eventId, 'ignored', 'Unhandled event type');
        return { processed: false, message: `Unhandled event type: ${event.event || 'unknown'}` };
    } catch (error) {
        await updateWebhookEventStatus('razorpay', eventId, 'failed', error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
};
