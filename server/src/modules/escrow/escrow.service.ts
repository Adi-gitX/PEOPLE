// ═══════════════════════════════════════════════════════════════════
// ESCROW SERVICE
// Full escrow payment system for secure transactions
// ═══════════════════════════════════════════════════════════════════

import { db } from '../../config/firebase.js';
import type { EscrowAccount, EscrowTransaction, PaymentSchedule, MilestonePayment } from '../../types/firestore.js';
import Stripe from 'stripe';
import { env } from '../../config/env.js';

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

const ESCROW_COLLECTION = 'escrowAccounts';
const TRANSACTIONS_COLLECTION = 'escrowTransactions';
const PAYMENT_SCHEDULES_COLLECTION = 'paymentSchedules';
const MISSIONS_COLLECTION = 'missions';

const PLATFORM_FEE_PERCENT = 0; // True zero platform markup

// ═══════════════════════════════════════════════════════════════════
// ESCROW ACCOUNT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Create an escrow account for a mission
 */
export const createEscrowAccount = async (
    missionId: string,
    initiatorId: string,
    totalAmount: number,
    currency: string = 'usd'
): Promise<EscrowAccount> => {
    if (totalAmount <= 0) {
        throw new Error('Total amount must be greater than zero');
    }

    const now = new Date();

    const escrowAccount: Omit<EscrowAccount, 'id'> = {
        missionId,
        initiatorId,
        totalFunded: 0,
        totalReleased: 0,
        totalRefunded: 0,
        balance: 0,
        holdAmount: 0,
        platformFee: 0,
        currency,
        stripePaymentIntentIds: [],
        stripeTransferIds: [],
        status: 'pending_funding',
        autoReleaseEnabled: true,
        autoReleaseDays: 14, // 14 days after submission
        createdAt: now,
        updatedAt: now,
    };

    const docRef = await db.collection(ESCROW_COLLECTION).add(escrowAccount);
    return { id: docRef.id, ...escrowAccount };
};

/**
 * Get escrow account by mission ID
 */
export const getEscrowAccountByMission = async (missionId: string): Promise<EscrowAccount | null> => {
    const snapshot = await db
        .collection(ESCROW_COLLECTION)
        .where('missionId', '==', missionId)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as EscrowAccount;
};

/**
 * Get escrow account by ID
 */
export const getEscrowAccountById = async (escrowId: string): Promise<EscrowAccount | null> => {
    const doc = await db.collection(ESCROW_COLLECTION).doc(escrowId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as EscrowAccount;
};

// ═══════════════════════════════════════════════════════════════════
// FUNDING OPERATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Fund escrow account (Initiator deposits money)
 */
export const fundEscrow = async (
    escrowId: string,
    amount: number,
    paymentMethodId?: string
): Promise<{ success: boolean; escrow?: EscrowAccount; clientSecret?: string; error?: string }> => {
    const escrow = await getEscrowAccountById(escrowId);
    if (!escrow) {
        return { success: false, error: 'Escrow account not found' };
    }

    const now = new Date();

    // If Stripe is configured, create payment intent
    if (stripe && paymentMethodId) {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: escrow.currency,
                payment_method: paymentMethodId,
                confirm: true,
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never',
                },
                metadata: {
                    escrowId,
                    missionId: escrow.missionId,
                    type: 'escrow_funding',
                },
            });

            if (paymentIntent.status === 'succeeded') {
                // Update escrow account
                const newBalance = escrow.balance + amount;
                const newTotalFunded = escrow.totalFunded + amount;

                await db.collection(ESCROW_COLLECTION).doc(escrowId).update({
                    balance: newBalance,
                    totalFunded: newTotalFunded,
                    status: 'funded',
                    stripePaymentIntentIds: [...escrow.stripePaymentIntentIds, paymentIntent.id],
                    fundedAt: escrow.fundedAt || now,
                    updatedAt: now,
                });

                // Record transaction
                await recordTransaction({
                    missionId: escrow.missionId,
                    initiatorId: escrow.initiatorId,
                    type: 'deposit',
                    amount,
                    currency: escrow.currency,
                    stripePaymentIntentId: paymentIntent.id,
                    status: 'completed',
                    description: 'Escrow funding',
                });

                // Update mission status
                await db.collection(MISSIONS_COLLECTION).doc(escrow.missionId).update({
                    status: 'open',
                    updatedAt: now,
                });

                const updatedEscrow = await getEscrowAccountById(escrowId);
                return { success: true, escrow: updatedEscrow! };
            } else if (paymentIntent.status === 'requires_action') {
                return { success: false, clientSecret: paymentIntent.client_secret || undefined };
            }
        } catch (error: any) {
            console.error('Stripe payment error:', error);
            return { success: false, error: error.message };
        }
    }

    // Demo mode: Just update balance
    const newBalance = escrow.balance + amount;
    const newTotalFunded = escrow.totalFunded + amount;

    await db.collection(ESCROW_COLLECTION).doc(escrowId).update({
        balance: newBalance,
        totalFunded: newTotalFunded,
        status: 'funded',
        fundedAt: escrow.fundedAt || now,
        updatedAt: now,
    });

    // Record transaction
    await recordTransaction({
        missionId: escrow.missionId,
        initiatorId: escrow.initiatorId,
        type: 'deposit',
        amount,
        currency: escrow.currency,
        status: 'completed',
        description: 'Escrow funding (demo mode)',
    });

    // Update mission status
    await db.collection(MISSIONS_COLLECTION).doc(escrow.missionId).update({
        status: 'open',
        updatedAt: now,
    });

    const updatedEscrow = await getEscrowAccountById(escrowId);
    return { success: true, escrow: updatedEscrow! };
};

// ═══════════════════════════════════════════════════════════════════
// RELEASE OPERATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Release funds to contributor (for approved milestone)
 */
export const releaseFunds = async (
    escrowId: string,
    contributorId: string,
    amount: number,
    milestoneId?: string,
    description?: string
): Promise<{ success: boolean; transaction?: EscrowTransaction; error?: string }> => {
    const escrow = await getEscrowAccountById(escrowId);
    if (!escrow) {
        return { success: false, error: 'Escrow account not found' };
    }

    if (escrow.balance < amount) {
        return { success: false, error: 'Insufficient escrow balance' };
    }

    const now = new Date();
    const platformFee = amount * (PLATFORM_FEE_PERCENT / 100);
    const netAmount = amount - platformFee;

    // If Stripe Connect is configured, transfer to contributor
    // (This would require contributors to have Stripe Connect accounts)
    // For now, we'll just record the transaction

    // Update escrow account
    const newBalance = escrow.balance - amount;
    const newTotalReleased = escrow.totalReleased + amount;
    const newPlatformFee = escrow.platformFee + platformFee;

    const status = newBalance === 0 ? 'completed' : 'partially_released';

    await db.collection(ESCROW_COLLECTION).doc(escrowId).update({
        balance: newBalance,
        totalReleased: newTotalReleased,
        platformFee: newPlatformFee,
        status,
        completedAt: status === 'completed' ? now : undefined,
        updatedAt: now,
    });

    // Record release transaction
    const transaction = await recordTransaction({
        missionId: escrow.missionId,
        milestoneId,
        initiatorId: escrow.initiatorId,
        contributorId,
        type: 'release',
        amount: netAmount,
        currency: escrow.currency,
        status: 'completed',
        description: description || 'Milestone payment release',
    });

    // Record platform fee transaction
    await recordTransaction({
        missionId: escrow.missionId,
        milestoneId,
        initiatorId: escrow.initiatorId,
        type: 'platform_fee',
        amount: platformFee,
        currency: escrow.currency,
        status: 'completed',
        description: 'Platform fee',
    });

    // Update milestone if provided
    if (milestoneId) {
        await db
            .collection(MISSIONS_COLLECTION)
            .doc(escrow.missionId)
            .collection('milestones')
            .doc(milestoneId)
            .update({
                status: 'paid',
                paidAt: now,
            });
    }

    // TODO: Credit contributor's wallet

    return { success: true, transaction };
};

// ═══════════════════════════════════════════════════════════════════
// REFUND OPERATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Refund funds to initiator
 */
export const refundFunds = async (
    escrowId: string,
    amount: number,
    reason?: string
): Promise<{ success: boolean; transaction?: EscrowTransaction; error?: string }> => {
    const escrow = await getEscrowAccountById(escrowId);
    if (!escrow) {
        return { success: false, error: 'Escrow account not found' };
    }

    if (escrow.balance < amount) {
        return { success: false, error: 'Insufficient escrow balance' };
    }

    const now = new Date();

    // Update escrow account
    const newBalance = escrow.balance - amount;
    const newTotalRefunded = escrow.totalRefunded + amount;

    await db.collection(ESCROW_COLLECTION).doc(escrowId).update({
        balance: newBalance,
        totalRefunded: newTotalRefunded,
        status: newBalance === 0 ? 'refunded' : 'partially_released',
        updatedAt: now,
    });

    // Record refund transaction
    const transaction = await recordTransaction({
        missionId: escrow.missionId,
        initiatorId: escrow.initiatorId,
        type: 'refund',
        amount,
        currency: escrow.currency,
        status: 'completed',
        description: reason || 'Escrow refund',
    });

    return { success: true, transaction };
};

// ═══════════════════════════════════════════════════════════════════
// DISPUTE HANDLING
// ═══════════════════════════════════════════════════════════════════

/**
 * Hold funds in dispute
 */
export const holdForDispute = async (
    escrowId: string,
    amount: number,
    disputeId: string
): Promise<{ success: boolean; error?: string }> => {
    const escrow = await getEscrowAccountById(escrowId);
    if (!escrow) {
        return { success: false, error: 'Escrow account not found' };
    }

    if (escrow.balance < amount) {
        return { success: false, error: 'Insufficient escrow balance' };
    }

    const now = new Date();

    // Move funds from balance to hold
    const newBalance = escrow.balance - amount;
    const newHoldAmount = escrow.holdAmount + amount;

    await db.collection(ESCROW_COLLECTION).doc(escrowId).update({
        balance: newBalance,
        holdAmount: newHoldAmount,
        status: 'disputed',
        updatedAt: now,
    });

    // Record dispute hold transaction
    await recordTransaction({
        missionId: escrow.missionId,
        initiatorId: escrow.initiatorId,
        type: 'dispute_hold',
        amount,
        currency: escrow.currency,
        status: 'completed',
        description: `Dispute hold: ${disputeId}`,
    });

    return { success: true };
};

/**
 * Release dispute hold (after resolution)
 */
export const releaseDisputeHold = async (
    escrowId: string,
    recipientId: string,
    recipientType: 'initiator' | 'contributor',
    amount: number,
    disputeId: string
): Promise<{ success: boolean; error?: string }> => {
    const escrow = await getEscrowAccountById(escrowId);
    if (!escrow) {
        return { success: false, error: 'Escrow account not found' };
    }

    if (escrow.holdAmount < amount) {
        return { success: false, error: 'Insufficient hold amount' };
    }

    const now = new Date();

    // Remove from hold
    const newHoldAmount = escrow.holdAmount - amount;

    await db.collection(ESCROW_COLLECTION).doc(escrowId).update({
        holdAmount: newHoldAmount,
        status: newHoldAmount === 0 && escrow.balance === 0 ? 'completed' : 'partially_released',
        updatedAt: now,
    });

    // Record dispute release transaction
    await recordTransaction({
        missionId: escrow.missionId,
        initiatorId: recipientType === 'initiator' ? recipientId : escrow.initiatorId,
        contributorId: recipientType === 'contributor' ? recipientId : undefined,
        type: 'dispute_release',
        amount,
        currency: escrow.currency,
        status: 'completed',
        description: `Dispute resolved: ${disputeId}`,
    });

    return { success: true };
};

// ═══════════════════════════════════════════════════════════════════
// PAYMENT SCHEDULE
// ═══════════════════════════════════════════════════════════════════

/**
 * Create payment schedule for mission milestones
 */
export const createPaymentSchedule = async (
    missionId: string,
    escrowAccountId: string,
    milestones: MilestonePayment[]
): Promise<PaymentSchedule> => {
    const now = new Date();
    const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);

    const schedule: Omit<PaymentSchedule, 'id'> = {
        missionId,
        escrowAccountId,
        milestones,
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        createdAt: now,
        updatedAt: now,
    };

    const docRef = await db.collection(PAYMENT_SCHEDULES_COLLECTION).add(schedule);
    return { id: docRef.id, ...schedule };
};

/**
 * Get payment schedule for mission
 */
export const getPaymentSchedule = async (missionId: string): Promise<PaymentSchedule | null> => {
    const snapshot = await db
        .collection(PAYMENT_SCHEDULES_COLLECTION)
        .where('missionId', '==', missionId)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as PaymentSchedule;
};

/**
 * Update milestone payment status
 */
export const updateMilestonePaymentStatus = async (
    scheduleId: string,
    milestoneId: string,
    status: MilestonePayment['status']
): Promise<void> => {
    const scheduleDoc = await db.collection(PAYMENT_SCHEDULES_COLLECTION).doc(scheduleId).get();
    if (!scheduleDoc.exists) return;

    const schedule = scheduleDoc.data() as PaymentSchedule;
    const now = new Date();

    const updatedMilestones = schedule.milestones.map(m => {
        if (m.milestoneId === milestoneId) {
            return {
                ...m,
                status,
                releasedAt: status === 'released' ? now : m.releasedAt,
            };
        }
        return m;
    });

    const paidAmount = updatedMilestones
        .filter(m => m.status === 'released')
        .reduce((sum, m) => sum + m.amount, 0);

    await db.collection(PAYMENT_SCHEDULES_COLLECTION).doc(scheduleId).update({
        milestones: updatedMilestones,
        paidAmount,
        remainingAmount: schedule.totalAmount - paidAmount,
        updatedAt: now,
    });
};

// ═══════════════════════════════════════════════════════════════════
// TRANSACTION RECORDING
// ═══════════════════════════════════════════════════════════════════

/**
 * Record an escrow transaction
 */
const recordTransaction = async (
    data: Omit<EscrowTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<EscrowTransaction> => {
    const now = new Date();

    const transaction: Omit<EscrowTransaction, 'id'> = {
        ...data,
        processedAt: now,
        createdAt: now,
        updatedAt: now,
    };

    const docRef = await db.collection(TRANSACTIONS_COLLECTION).add(transaction);
    return { id: docRef.id, ...transaction };
};

/**
 * Get transactions for escrow account
 */
export const getTransactionsByMission = async (missionId: string): Promise<EscrowTransaction[]> => {
    const snapshot = await db
        .collection(TRANSACTIONS_COLLECTION)
        .where('missionId', '==', missionId)
        .get();

    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EscrowTransaction));

    // Sort by createdAt descending
    return transactions.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
        return dateB - dateA;
    });
};

/**
 * Get all transactions for a user
 */
export const getTransactionsByUser = async (userId: string): Promise<EscrowTransaction[]> => {
    // Get as initiator
    const initiatorSnapshot = await db
        .collection(TRANSACTIONS_COLLECTION)
        .where('initiatorId', '==', userId)
        .get();

    // Get as contributor
    const contributorSnapshot = await db
        .collection(TRANSACTIONS_COLLECTION)
        .where('contributorId', '==', userId)
        .get();

    const transactions = [
        ...initiatorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EscrowTransaction)),
        ...contributorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EscrowTransaction)),
    ];

    // Remove duplicates and sort
    const uniqueTransactions = Array.from(new Map(transactions.map(t => [t.id, t])).values());

    return uniqueTransactions.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
        return dateB - dateA;
    });
};
