// ═══════════════════════════════════════════════════════════════════
// WALLET SERVICE
// User wallet management for earnings, balances, and transactions
// ═══════════════════════════════════════════════════════════════════

import { db } from '../../config/firebase.js';
import type { UserWallet, WalletTransaction, WithdrawalRequest } from '../../types/firestore.js';

const WALLETS_COLLECTION = 'wallets';
const TRANSACTIONS_COLLECTION = 'walletTransactions';
const WITHDRAWALS_COLLECTION = 'withdrawalRequests';
const CONTRIBUTOR_PROFILES_COLLECTION = 'contributorProfiles';

// ═══════════════════════════════════════════════════════════════════
// WALLET MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Get or create wallet for user
 */
export const getOrCreateWallet = async (userId: string): Promise<UserWallet> => {
    // Try to find existing wallet
    const snapshot = await db
        .collection(WALLETS_COLLECTION)
        .where('userId', '==', userId)
        .limit(1)
        .get();

    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as UserWallet;
    }

    // Create new wallet
    const now = new Date();
    const wallet: Omit<UserWallet, 'id'> = {
        userId,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        totalWithdrawn: 0,
        currency: 'usd',
        stripeConnectStatus: 'not_started',
        stripePayoutsEnabled: false,
        createdAt: now,
        updatedAt: now,
    };

    const docRef = await db.collection(WALLETS_COLLECTION).add(wallet);
    return { id: docRef.id, ...wallet };
};

/**
 * Get wallet by user ID
 */
export const getWalletByUserId = async (userId: string): Promise<UserWallet | null> => {
    const snapshot = await db
        .collection(WALLETS_COLLECTION)
        .where('userId', '==', userId)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as UserWallet;
};

/**
 * Get wallet by ID
 */
export const getWalletById = async (walletId: string): Promise<UserWallet | null> => {
    const doc = await db.collection(WALLETS_COLLECTION).doc(walletId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as UserWallet;
};

// ═══════════════════════════════════════════════════════════════════
// BALANCE OPERATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Add earnings to wallet (from escrow release)
 */
export const addEarnings = async (
    userId: string,
    amount: number,
    description: string,
    referenceType?: WalletTransaction['referenceType'],
    referenceId?: string
): Promise<WalletTransaction> => {
    const wallet = await getOrCreateWallet(userId);
    const now = new Date();

    // Update wallet balances
    const newAvailableBalance = wallet.availableBalance + amount;
    const newTotalEarnings = wallet.totalEarnings + amount;

    await db.collection(WALLETS_COLLECTION).doc(wallet.id!).update({
        availableBalance: newAvailableBalance,
        totalEarnings: newTotalEarnings,
        lastTransactionAt: now,
        updatedAt: now,
    });

    // Record transaction
    const transaction: Omit<WalletTransaction, 'id'> = {
        userId,
        walletId: wallet.id!,
        type: 'earning',
        amount,
        balanceAfter: newAvailableBalance,
        description,
        referenceType,
        referenceId,
        status: 'completed',
        createdAt: now,
        updatedAt: now,
    };

    const txRef = await db.collection(TRANSACTIONS_COLLECTION).add(transaction);
    return { id: txRef.id, ...transaction };
};

/**
 * Add pending earnings (waiting for approval)
 */
export const addPendingEarnings = async (
    userId: string,
    amount: number,
    description: string,
    referenceType?: WalletTransaction['referenceType'],
    referenceId?: string
): Promise<WalletTransaction> => {
    const wallet = await getOrCreateWallet(userId);
    const now = new Date();

    // Update pending balance
    const newPendingBalance = wallet.pendingBalance + amount;

    await db.collection(WALLETS_COLLECTION).doc(wallet.id!).update({
        pendingBalance: newPendingBalance,
        lastTransactionAt: now,
        updatedAt: now,
    });

    // Record transaction as pending
    const transaction: Omit<WalletTransaction, 'id'> = {
        userId,
        walletId: wallet.id!,
        type: 'earning',
        amount,
        balanceAfter: wallet.availableBalance,
        description,
        referenceType,
        referenceId,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
    };

    const txRef = await db.collection(TRANSACTIONS_COLLECTION).add(transaction);
    return { id: txRef.id, ...transaction };
};

/**
 * Release pending earnings to available balance
 */
export const releasePendingEarnings = async (
    userId: string,
    amount: number,
    transactionId: string
): Promise<void> => {
    const wallet = await getOrCreateWallet(userId);
    const now = new Date();

    if (wallet.pendingBalance < amount) {
        throw new Error('Insufficient pending balance');
    }

    // Move from pending to available
    const newPendingBalance = wallet.pendingBalance - amount;
    const newAvailableBalance = wallet.availableBalance + amount;
    const newTotalEarnings = wallet.totalEarnings + amount;

    await db.collection(WALLETS_COLLECTION).doc(wallet.id!).update({
        pendingBalance: newPendingBalance,
        availableBalance: newAvailableBalance,
        totalEarnings: newTotalEarnings,
        lastTransactionAt: now,
        updatedAt: now,
    });

    // Update transaction status
    await db.collection(TRANSACTIONS_COLLECTION).doc(transactionId).update({
        status: 'completed',
        balanceAfter: newAvailableBalance,
        updatedAt: now,
    });
};

/**
 * Deduct from wallet (for withdrawal)
 */
export const deductBalance = async (
    userId: string,
    amount: number,
    description: string,
    referenceType?: WalletTransaction['referenceType'],
    referenceId?: string
): Promise<WalletTransaction> => {
    const wallet = await getOrCreateWallet(userId);
    const now = new Date();

    if (wallet.availableBalance < amount) {
        throw new Error('Insufficient balance');
    }

    // Update balance
    const newAvailableBalance = wallet.availableBalance - amount;

    await db.collection(WALLETS_COLLECTION).doc(wallet.id!).update({
        availableBalance: newAvailableBalance,
        lastTransactionAt: now,
        updatedAt: now,
    });

    // Record transaction
    const transaction: Omit<WalletTransaction, 'id'> = {
        userId,
        walletId: wallet.id!,
        type: 'withdrawal',
        amount: -amount,
        balanceAfter: newAvailableBalance,
        description,
        referenceType,
        referenceId,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
    };

    const txRef = await db.collection(TRANSACTIONS_COLLECTION).add(transaction);
    return { id: txRef.id, ...transaction };
};

/**
 * Add bonus to wallet
 */
export const addBonus = async (
    userId: string,
    amount: number,
    description: string
): Promise<WalletTransaction> => {
    return addEarnings(userId, amount, description, undefined, undefined);
};

/**
 * Process refund to wallet
 */
export const processRefund = async (
    userId: string,
    amount: number,
    description: string,
    referenceType?: WalletTransaction['referenceType'],
    referenceId?: string
): Promise<WalletTransaction> => {
    const wallet = await getOrCreateWallet(userId);
    const now = new Date();

    // Add to available balance
    const newAvailableBalance = wallet.availableBalance + amount;

    await db.collection(WALLETS_COLLECTION).doc(wallet.id!).update({
        availableBalance: newAvailableBalance,
        lastTransactionAt: now,
        updatedAt: now,
    });

    // Record transaction
    const transaction: Omit<WalletTransaction, 'id'> = {
        userId,
        walletId: wallet.id!,
        type: 'refund',
        amount,
        balanceAfter: newAvailableBalance,
        description,
        referenceType,
        referenceId,
        status: 'completed',
        createdAt: now,
        updatedAt: now,
    };

    const txRef = await db.collection(TRANSACTIONS_COLLECTION).add(transaction);
    return { id: txRef.id, ...transaction };
};

// ═══════════════════════════════════════════════════════════════════
// WITHDRAWAL OPERATIONS
// ═══════════════════════════════════════════════════════════════════

const PLATFORM_WITHDRAWAL_FEE_PERCENT = 0; // True zero platform markup
const PROCESSING_FEE_FLAT = Number(process.env.WITHDRAWAL_PROCESSING_FEE || 0); // Optional pass-through processor fee

const assertContributorKycEligible = async (userId: string): Promise<void> => {
    const profileDoc = await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(userId).get();
    if (!profileDoc.exists) {
        throw new Error('Contributor profile not found');
    }

    const verificationStatus = profileDoc.data()?.verificationStatus;
    if (verificationStatus !== 'verified') {
        throw new Error('KYC verification required before withdrawal');
    }
};

/**
 * Request withdrawal
 */
export const requestWithdrawal = async (
    userId: string,
    amount: number,
    payoutMethod: WithdrawalRequest['payoutMethod'],
    payoutDetails: Record<string, string>
): Promise<WithdrawalRequest> => {
    if (payoutMethod !== 'bank_transfer') {
        throw new Error('Only bank transfer payouts are supported at this time');
    }

    await assertContributorKycEligible(userId);

    const wallet = await getOrCreateWallet(userId);

    if (wallet.availableBalance < amount) {
        throw new Error('Insufficient balance');
    }

    // Calculate fees
    const platformFee = amount * (PLATFORM_WITHDRAWAL_FEE_PERCENT / 100);
    const processingFee = PROCESSING_FEE_FLAT;
    const netAmount = amount - platformFee - processingFee;

    if (netAmount <= 0) {
        throw new Error('Amount too small after fees');
    }

    const now = new Date();

    // Deduct from wallet
    const newAvailableBalance = wallet.availableBalance - amount;
    await db.collection(WALLETS_COLLECTION).doc(wallet.id!).update({
        availableBalance: newAvailableBalance,
        lastTransactionAt: now,
        updatedAt: now,
    });

    // Create withdrawal request
    const withdrawal: Omit<WithdrawalRequest, 'id'> = {
        userId,
        amount,
        currency: wallet.currency,
        payoutMethod,
        payoutDetails,
        status: 'pending',
        platformFee,
        processingFee,
        netAmount,
        createdAt: now,
        updatedAt: now,
    };

    const docRef = await db.collection(WITHDRAWALS_COLLECTION).add(withdrawal);

    // Record transaction
    await db.collection(TRANSACTIONS_COLLECTION).add({
        userId,
        walletId: wallet.id,
        type: 'withdrawal',
        amount: -amount,
        balanceAfter: newAvailableBalance,
        description: `Withdrawal via ${payoutMethod}`,
        referenceType: 'withdrawal',
        referenceId: docRef.id,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
    });

    return { id: docRef.id, ...withdrawal };
};

/**
 * Get user's withdrawal requests
 */
export const getUserWithdrawals = async (userId: string): Promise<WithdrawalRequest[]> => {
    const snapshot = await db
        .collection(WITHDRAWALS_COLLECTION)
        .where('userId', '==', userId)
        .get();

    const withdrawals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));

    // Sort by createdAt descending
    return withdrawals.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
        return dateB - dateA;
    });
};

export const getAllWithdrawals = async (options: {
    status?: WithdrawalRequest['status'];
    limit?: number;
} = {}): Promise<WithdrawalRequest[]> => {
    let query: FirebaseFirestore.Query = db.collection(WITHDRAWALS_COLLECTION);

    if (options.status) {
        query = query.where('status', '==', options.status);
    }

    if (options.limit) {
        query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    const withdrawals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));

    return withdrawals.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
        return dateB - dateA;
    });
};

/**
 * Process withdrawal (admin/system action)
 */
export const processWithdrawal = async (
    withdrawalId: string,
    transactionId?: string
): Promise<WithdrawalRequest> => {
    const doc = await db.collection(WITHDRAWALS_COLLECTION).doc(withdrawalId).get();
    if (!doc.exists) {
        throw new Error('Withdrawal request not found');
    }

    const withdrawal = { id: doc.id, ...doc.data() } as WithdrawalRequest;
    const now = new Date();

    // Update withdrawal status
    await db.collection(WITHDRAWALS_COLLECTION).doc(withdrawalId).update({
        status: 'completed',
        transactionId,
        processedAt: now,
        updatedAt: now,
    });

    // Update wallet totalWithdrawn
    const wallet = await getWalletByUserId(withdrawal.userId);
    if (wallet) {
        await db.collection(WALLETS_COLLECTION).doc(wallet.id!).update({
            totalWithdrawn: wallet.totalWithdrawn + withdrawal.netAmount,
            updatedAt: now,
        });
    }

    // Update transaction status
    const txSnapshot = await db
        .collection(TRANSACTIONS_COLLECTION)
        .where('referenceId', '==', withdrawalId)
        .where('type', '==', 'withdrawal')
        .limit(1)
        .get();

    if (!txSnapshot.empty) {
        await txSnapshot.docs[0].ref.update({
            status: 'completed',
            updatedAt: now,
        });
    }

    return { ...withdrawal, status: 'completed', processedAt: now };
};

/**
 * Cancel/fail withdrawal (refund to wallet)
 */
export const cancelWithdrawal = async (
    withdrawalId: string,
    reason: string
): Promise<WithdrawalRequest> => {
    const doc = await db.collection(WITHDRAWALS_COLLECTION).doc(withdrawalId).get();
    if (!doc.exists) {
        throw new Error('Withdrawal request not found');
    }

    const withdrawal = { id: doc.id, ...doc.data() } as WithdrawalRequest;

    if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
        throw new Error('Cannot cancel withdrawal in current status');
    }

    const now = new Date();

    // Refund to wallet
    const wallet = await getWalletByUserId(withdrawal.userId);
    if (wallet) {
        await db.collection(WALLETS_COLLECTION).doc(wallet.id!).update({
            availableBalance: wallet.availableBalance + withdrawal.amount,
            lastTransactionAt: now,
            updatedAt: now,
        });
    }

    // Update withdrawal status
    await db.collection(WITHDRAWALS_COLLECTION).doc(withdrawalId).update({
        status: 'cancelled',
        failureReason: reason,
        updatedAt: now,
    });

    // Update transaction status
    const txSnapshot = await db
        .collection(TRANSACTIONS_COLLECTION)
        .where('referenceId', '==', withdrawalId)
        .where('type', '==', 'withdrawal')
        .limit(1)
        .get();

    if (!txSnapshot.empty) {
        await txSnapshot.docs[0].ref.update({
            status: 'reversed',
            updatedAt: now,
        });
    }

    return { ...withdrawal, status: 'cancelled', failureReason: reason };
};

export const updateWithdrawalStatus = async (
    withdrawalId: string,
    action: 'approve' | 'reject' | 'mark_paid',
    adminId: string,
    notes?: string,
    transactionReference?: string
): Promise<WithdrawalRequest> => {
    const doc = await db.collection(WITHDRAWALS_COLLECTION).doc(withdrawalId).get();
    if (!doc.exists) {
        throw new Error('Withdrawal request not found');
    }

    const withdrawal = { id: doc.id, ...doc.data() } as WithdrawalRequest;
    const now = new Date();

    if (action === 'approve') {
        if (withdrawal.status !== 'pending') {
            throw new Error('Only pending withdrawals can be approved');
        }
        await doc.ref.update({
            status: 'processing',
            approvedBy: adminId,
            approvalNotes: notes || null,
            updatedAt: now,
        });
        return { ...withdrawal, status: 'processing', updatedAt: now } as WithdrawalRequest;
    }

    if (action === 'reject') {
        if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
            throw new Error('Withdrawal cannot be rejected in current status');
        }
        return cancelWithdrawal(withdrawalId, notes || 'Rejected by admin');
    }

    if (withdrawal.status !== 'processing') {
        throw new Error('Only processing withdrawals can be marked as paid');
    }

    const completed = await processWithdrawal(withdrawalId, transactionReference);
    await db.collection(WITHDRAWALS_COLLECTION).doc(withdrawalId).update({
        paidBy: adminId,
        paymentNotes: notes || null,
        updatedAt: now,
    });
    return completed;
};

// ═══════════════════════════════════════════════════════════════════
// TRANSACTION HISTORY
// ═══════════════════════════════════════════════════════════════════

/**
 * Get user's transaction history
 */
export const getTransactionHistory = async (
    userId: string,
    limit: number = 50,
    _offset: number = 0
): Promise<WalletTransaction[]> => {
    const snapshot = await db
        .collection(TRANSACTIONS_COLLECTION)
        .where('userId', '==', userId)
        .limit(limit)
        .get();

    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction));

    // Sort by createdAt descending
    return transactions.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
        return dateB - dateA;
    });
};

/**
 * Get wallet summary/stats
 */
export const getWalletSummary = async (userId: string): Promise<{
    wallet: UserWallet;
    recentTransactions: WalletTransaction[];
    pendingWithdrawals: number;
    monthlyEarnings: number;
}> => {
    const wallet = await getOrCreateWallet(userId);
    const transactions = await getTransactionHistory(userId, 10);

    // Get pending withdrawals
    const pendingWithdrawalsSnapshot = await db
        .collection(WITHDRAWALS_COLLECTION)
        .where('userId', '==', userId)
        .where('status', 'in', ['pending', 'processing'])
        .get();

    const pendingWithdrawals = pendingWithdrawalsSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().amount || 0),
        0
    );

    // Calculate monthly earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyEarningsSnapshot = await db
        .collection(TRANSACTIONS_COLLECTION)
        .where('userId', '==', userId)
        .where('type', '==', 'earning')
        .where('status', '==', 'completed')
        .get();

    const monthlyEarnings = monthlyEarningsSnapshot.docs
        .filter(doc => {
            const createdAt = doc.data().createdAt;
            const date = createdAt instanceof Date ? createdAt : new Date(createdAt?.seconds * 1000);
            return date >= startOfMonth;
        })
        .reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

    return {
        wallet,
        recentTransactions: transactions,
        pendingWithdrawals,
        monthlyEarnings,
    };
};
