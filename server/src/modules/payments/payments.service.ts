import { db } from '../../config/firebase.js';
import type { EscrowTransaction } from '../../types/firestore.js';

const PAYMENTS_COLLECTION = 'payments';
const MISSIONS_COLLECTION = 'missions';
const CONTRIBUTOR_PROFILES_COLLECTION = 'contributorProfiles';

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

export const createEscrowDeposit = async (
    missionId: string,
    initiatorId: string,
    amount: number
): Promise<EscrowTransaction> => {
    const transaction: Omit<EscrowTransaction, 'id'> = {
        missionId,
        initiatorId,
        type: 'deposit',
        amount,
        currency: 'USD',
        status: 'completed',
        description: 'Mission escrow deposit',
        createdAt: new Date(),
        processedAt: new Date(),
    };

    const docRef = await db.collection(PAYMENTS_COLLECTION).add(transaction);

    await db.collection(MISSIONS_COLLECTION).doc(missionId).update({
        escrowStatus: 'held',
        escrowAmount: amount,
    });

    return { id: docRef.id, ...transaction };
};

export const releaseEscrow = async (
    missionId: string,
    contributorId: string,
    amount: number
): Promise<EscrowTransaction> => {
    const transaction: Omit<EscrowTransaction, 'id'> = {
        missionId,
        contributorId,
        initiatorId: '',
        type: 'release',
        amount,
        currency: 'USD',
        status: 'completed',
        description: 'Escrow release to contributor',
        createdAt: new Date(),
        processedAt: new Date(),
    };

    const docRef = await db.collection(PAYMENTS_COLLECTION).add(transaction);

    await db.collection(MISSIONS_COLLECTION).doc(missionId).update({
        escrowStatus: 'released',
    });

    const profileRef = db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(contributorId);
    const profileDoc = await profileRef.get();
    if (profileDoc.exists) {
        const currentEarnings = profileDoc.data()?.totalEarnings || 0;
        await profileRef.update({
            totalEarnings: currentEarnings + amount,
        });
    }

    return { id: docRef.id, ...transaction };
};

export const refundEscrow = async (
    missionId: string,
    initiatorId: string,
    amount: number
): Promise<EscrowTransaction> => {
    const transaction: Omit<EscrowTransaction, 'id'> = {
        missionId,
        initiatorId,
        type: 'refund',
        amount,
        currency: 'USD',
        status: 'completed',
        description: 'Escrow refund to initiator',
        createdAt: new Date(),
        processedAt: new Date(),
    };

    const docRef = await db.collection(PAYMENTS_COLLECTION).add(transaction);

    await db.collection(MISSIONS_COLLECTION).doc(missionId).update({
        escrowStatus: 'refunded',
    });

    return { id: docRef.id, ...transaction };
};

export const getContributorBalance = async (contributorId: string): Promise<WalletBalance> => {
    const releasedSnapshot = await db
        .collection(PAYMENTS_COLLECTION)
        .where('contributorId', '==', contributorId)
        .where('type', '==', 'release')
        .where('status', '==', 'completed')
        .get();

    const pendingSnapshot = await db
        .collection(PAYMENTS_COLLECTION)
        .where('contributorId', '==', contributorId)
        .where('status', '==', 'pending')
        .get();

    const available = releasedSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    const pending = pendingSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

    return {
        available,
        pending,
        total: available + pending,
    };
};

export const getPaymentHistory = async (
    userId: string,
    role: 'contributor' | 'initiator'
): Promise<EscrowTransaction[]> => {
    const field = role === 'contributor' ? 'contributorId' : 'initiatorId';
    const snapshot = await db
        .collection(PAYMENTS_COLLECTION)
        .where(field, '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EscrowTransaction));
};

export const getMissionPayments = async (missionId: string): Promise<EscrowTransaction[]> => {
    const snapshot = await db
        .collection(PAYMENTS_COLLECTION)
        .where('missionId', '==', missionId)
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EscrowTransaction));
};

export const createCheckoutSession = async (
    missionId: string,
    initiatorId: string,
    amount: number,
    successUrl: string,
    cancelUrl: string
): Promise<{ sessionUrl: string }> => {
    // Production: Use Stripe Checkout
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // const session = await stripe.checkout.sessions.create({
    //     payment_method_types: ['card'],
    //     line_items: [{ ... }],
    //     mode: 'payment',
    //     success_url: successUrl,
    //     cancel_url: cancelUrl,
    //     metadata: { missionId, initiatorId },
    // });
    // return { sessionUrl: session.url };

    // Demo: Create deposit immediately
    await createEscrowDeposit(missionId, initiatorId, amount);
    return { sessionUrl: successUrl };
};
