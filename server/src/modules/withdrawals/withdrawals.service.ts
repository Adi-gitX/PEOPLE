// Withdrawals Service
// Handles payout requests from contributors

import { db } from '../../config/firebase.js';

const WITHDRAWALS_COLLECTION = 'withdrawals';
const CONTRIBUTOR_PROFILES_COLLECTION = 'contributorProfiles';

export interface Withdrawal {
    id: string;
    contributorId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    payoutMethod: 'bank_transfer' | 'paypal' | 'stripe';
    payoutDetails: PayoutDetails;
    processedAt?: Date;
    failureReason?: string;
    transactionId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PayoutDetails {
    // Bank Transfer
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    accountHolderName?: string;
    // PayPal
    paypalEmail?: string;
    // Stripe Connect
    stripeAccountId?: string;
}

export interface CreateWithdrawal {
    amount: number;
    payoutMethod: Withdrawal['payoutMethod'];
    payoutDetails: PayoutDetails;
}

export interface PayoutSettings {
    contributorId: string;
    preferredMethod: Withdrawal['payoutMethod'];
    bankDetails?: PayoutDetails;
    paypalEmail?: string;
    stripeAccountId?: string;
    isVerified: boolean;
}

// Get available balance
export const getAvailableBalance = async (contributorId: string): Promise<number> => {
    const profileDoc = await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(contributorId).get();
    if (!profileDoc.exists) return 0;
    return profileDoc.data()?.totalEarnings || 0;
};

// Get pending withdrawals amount
export const getPendingWithdrawals = async (contributorId: string): Promise<number> => {
    const snapshot = await db
        .collection(WITHDRAWALS_COLLECTION)
        .where('contributorId', '==', contributorId)
        .where('status', 'in', ['pending', 'processing'])
        .get();

    return snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
};

// Create withdrawal request
export const createWithdrawal = async (
    contributorId: string,
    data: CreateWithdrawal
): Promise<Withdrawal> => {
    // Validate balance
    const availableBalance = await getAvailableBalance(contributorId);
    const pendingAmount = await getPendingWithdrawals(contributorId);
    const withdrawableAmount = availableBalance - pendingAmount;

    if (data.amount > withdrawableAmount) {
        throw new Error(`Insufficient balance. Available: $${withdrawableAmount.toFixed(2)}`);
    }

    if (data.amount < 10) {
        throw new Error('Minimum withdrawal amount is $10');
    }

    const withdrawal: Omit<Withdrawal, 'id'> = {
        contributorId,
        amount: data.amount,
        currency: 'USD',
        status: 'pending',
        payoutMethod: data.payoutMethod,
        payoutDetails: data.payoutDetails,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const docRef = await db.collection(WITHDRAWALS_COLLECTION).add(withdrawal);
    return { id: docRef.id, ...withdrawal };
};

// Get withdrawal history
export const getWithdrawalHistory = async (contributorId: string): Promise<Withdrawal[]> => {
    const snapshot = await db
        .collection(WITHDRAWALS_COLLECTION)
        .where('contributorId', '==', contributorId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
};

// Get withdrawal by ID
export const getWithdrawalById = async (withdrawalId: string): Promise<Withdrawal | null> => {
    const doc = await db.collection(WITHDRAWALS_COLLECTION).doc(withdrawalId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Withdrawal;
};

// Cancel withdrawal (if still pending)
export const cancelWithdrawal = async (
    withdrawalId: string,
    contributorId: string
): Promise<void> => {
    const withdrawal = await getWithdrawalById(withdrawalId);
    if (!withdrawal) throw new Error('Withdrawal not found');
    if (withdrawal.contributorId !== contributorId) throw new Error('Not authorized');
    if (withdrawal.status !== 'pending') throw new Error('Can only cancel pending withdrawals');

    await db.collection(WITHDRAWALS_COLLECTION).doc(withdrawalId).update({
        status: 'cancelled',
        updatedAt: new Date(),
    });
};

// Process withdrawal (admin/system)
export const processWithdrawal = async (
    withdrawalId: string,
    transactionId?: string
): Promise<void> => {
    await db.collection(WITHDRAWALS_COLLECTION).doc(withdrawalId).update({
        status: 'processing',
        transactionId,
        updatedAt: new Date(),
    });
};

// Complete withdrawal (admin/system)
export const completeWithdrawal = async (
    withdrawalId: string,
    transactionId: string
): Promise<void> => {
    const withdrawal = await getWithdrawalById(withdrawalId);
    if (!withdrawal) throw new Error('Withdrawal not found');

    await db.collection(WITHDRAWALS_COLLECTION).doc(withdrawalId).update({
        status: 'completed',
        transactionId,
        processedAt: new Date(),
        updatedAt: new Date(),
    });

    // Deduct from contributor's balance
    const profileRef = db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(withdrawal.contributorId);
    const profileDoc = await profileRef.get();
    if (profileDoc.exists) {
        const currentEarnings = profileDoc.data()?.totalEarnings || 0;
        await profileRef.update({
            totalEarnings: Math.max(0, currentEarnings - withdrawal.amount),
        });
    }
};

// Fail withdrawal (admin/system)
export const failWithdrawal = async (
    withdrawalId: string,
    reason: string
): Promise<void> => {
    await db.collection(WITHDRAWALS_COLLECTION).doc(withdrawalId).update({
        status: 'failed',
        failureReason: reason,
        updatedAt: new Date(),
    });
};

// Get payout settings
export const getPayoutSettings = async (contributorId: string): Promise<PayoutSettings | null> => {
    const doc = await db.collection('payoutSettings').doc(contributorId).get();
    if (!doc.exists) return null;
    return doc.data() as PayoutSettings;
};

// Update payout settings
export const updatePayoutSettings = async (
    contributorId: string,
    settings: Partial<PayoutSettings>
): Promise<void> => {
    await db.collection('payoutSettings').doc(contributorId).set(
        { ...settings, contributorId, updatedAt: new Date() },
        { merge: true }
    );
};
