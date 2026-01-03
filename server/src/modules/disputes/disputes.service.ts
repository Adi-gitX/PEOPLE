// Disputes Module - Service
// Handles dispute creation, management, and resolution

import { db } from '../../config/firebase.js';

const DISPUTES_COLLECTION = 'disputes';
const MISSIONS_COLLECTION = 'missions';

export interface Dispute {
    id: string;
    missionId: string;
    raisedBy: string;
    raisedByName?: string;
    against: string;
    againstName?: string;
    reason: 'quality' | 'timeline' | 'communication' | 'payment' | 'other';
    description: string;
    evidence: string[];
    status: 'open' | 'under_review' | 'resolved' | 'escalated' | 'closed';
    resolution?: string;
    resolvedBy?: string;
    initiatorId: string;
    contributorId: string;
    missionTitle?: string;
    amount?: number;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
}

export interface CreateDispute {
    missionId: string;
    against: string;
    reason: 'quality' | 'timeline' | 'communication' | 'payment' | 'other';
    description: string;
    evidence?: string[];
}

// Create a new dispute
export const createDispute = async (
    userId: string,
    userName: string,
    data: CreateDispute
): Promise<Dispute> => {
    // Verify mission exists and user is involved
    const missionDoc = await db.collection(MISSIONS_COLLECTION).doc(data.missionId).get();
    if (!missionDoc.exists) {
        throw new Error('Mission not found');
    }

    const mission = missionDoc.data()!;

    // Check if user is involved in this mission
    const isInitiator = mission.initiatorId === userId;
    const isContributor = mission.contributorId === userId;

    if (!isInitiator && !isContributor) {
        throw new Error('You are not part of this mission');
    }

    // Check for existing open dispute
    const existingDispute = await db.collection(DISPUTES_COLLECTION)
        .where('missionId', '==', data.missionId)
        .where('status', 'in', ['open', 'under_review'])
        .get();

    if (!existingDispute.empty) {
        throw new Error('An active dispute already exists for this mission');
    }

    const dispute: Omit<Dispute, 'id'> = {
        missionId: data.missionId,
        raisedBy: userId,
        raisedByName: userName,
        against: data.against,
        reason: data.reason,
        description: data.description,
        evidence: data.evidence || [],
        status: 'open',
        initiatorId: mission.initiatorId,
        contributorId: mission.contributorId || data.against,
        missionTitle: mission.title,
        amount: mission.budgetMax,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const docRef = await db.collection(DISPUTES_COLLECTION).add(dispute);

    // Update mission status
    await db.collection(MISSIONS_COLLECTION).doc(data.missionId).update({
        status: 'disputed',
        updatedAt: new Date(),
    });

    return { id: docRef.id, ...dispute };
};

// Get dispute by ID
export const getDisputeById = async (disputeId: string): Promise<Dispute | null> => {
    const doc = await db.collection(DISPUTES_COLLECTION).doc(disputeId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Dispute;
};

// Get disputes for a user
export const getDisputesForUser = async (userId: string): Promise<Dispute[]> => {
    const snapshot = await db.collection(DISPUTES_COLLECTION)
        .where('raisedBy', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    const againstSnapshot = await db.collection(DISPUTES_COLLECTION)
        .where('against', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    const disputes = new Map<string, Dispute>();

    snapshot.docs.forEach(doc => {
        disputes.set(doc.id, { id: doc.id, ...doc.data() } as Dispute);
    });

    againstSnapshot.docs.forEach(doc => {
        if (!disputes.has(doc.id)) {
            disputes.set(doc.id, { id: doc.id, ...doc.data() } as Dispute);
        }
    });

    return Array.from(disputes.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Get all disputes (admin)
export const getAllDisputes = async (
    status?: string,
    limit: number = 50
): Promise<Dispute[]> => {
    let query = db.collection(DISPUTES_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(limit);

    if (status) {
        query = db.collection(DISPUTES_COLLECTION)
            .where('status', '==', status)
            .orderBy('createdAt', 'desc')
            .limit(limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dispute));
};

// Add response to dispute
export const addDisputeResponse = async (
    disputeId: string,
    userId: string,
    response: string
): Promise<Dispute> => {
    const dispute = await getDisputeById(disputeId);
    if (!dispute) {
        throw new Error('Dispute not found');
    }

    // Verify user is the one against whom dispute is filed
    if (dispute.against !== userId) {
        throw new Error('Only the respondent can add a response');
    }

    if (dispute.status !== 'open') {
        throw new Error('Cannot respond to a dispute that is not open');
    }

    await db.collection(DISPUTES_COLLECTION).doc(disputeId).update({
        response,
        respondedAt: new Date(),
        status: 'under_review',
        updatedAt: new Date(),
    });

    return { ...dispute, status: 'under_review' };
};

// Add evidence
export const addEvidence = async (
    disputeId: string,
    userId: string,
    evidenceUrl: string
): Promise<Dispute> => {
    const dispute = await getDisputeById(disputeId);
    if (!dispute) {
        throw new Error('Dispute not found');
    }

    if (dispute.raisedBy !== userId && dispute.against !== userId) {
        throw new Error('Only parties involved can add evidence');
    }

    if (['resolved', 'closed'].includes(dispute.status)) {
        throw new Error('Cannot add evidence to a closed dispute');
    }

    const evidence = [...(dispute.evidence || []), evidenceUrl];

    await db.collection(DISPUTES_COLLECTION).doc(disputeId).update({
        evidence,
        updatedAt: new Date(),
    });

    return { ...dispute, evidence };
};

// Resolve dispute (admin only)
export const resolveDispute = async (
    disputeId: string,
    adminId: string,
    resolution: 'favor_initiator' | 'favor_contributor' | 'split' | 'dismissed',
    notes: string
): Promise<Dispute> => {
    const dispute = await getDisputeById(disputeId);
    if (!dispute) {
        throw new Error('Dispute not found');
    }

    let resolutionText = '';
    switch (resolution) {
        case 'favor_initiator':
            resolutionText = 'Resolved in favor of the initiator. Funds returned.';
            break;
        case 'favor_contributor':
            resolutionText = 'Resolved in favor of the contributor. Payment released.';
            break;
        case 'split':
            resolutionText = 'Resolved with a split decision. Funds divided.';
            break;
        case 'dismissed':
            resolutionText = 'Dispute dismissed. Original terms apply.';
            break;
    }

    await db.collection(DISPUTES_COLLECTION).doc(disputeId).update({
        status: 'resolved',
        resolution: `${resolutionText}\n\nAdmin notes: ${notes}`,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        updatedAt: new Date(),
    });

    // Update mission status
    await db.collection(MISSIONS_COLLECTION).doc(dispute.missionId).update({
        status: resolution === 'favor_contributor' ? 'completed' : 'cancelled',
        updatedAt: new Date(),
    });

    return { ...dispute, status: 'resolved', resolution: resolutionText, resolvedBy: adminId };
};

// Escalate dispute
export const escalateDispute = async (
    disputeId: string,
    userId: string,
    reason: string
): Promise<Dispute> => {
    const dispute = await getDisputeById(disputeId);
    if (!dispute) {
        throw new Error('Dispute not found');
    }

    if (dispute.raisedBy !== userId && dispute.against !== userId) {
        throw new Error('Only parties involved can escalate');
    }

    if (dispute.status !== 'under_review') {
        throw new Error('Only disputes under review can be escalated');
    }

    await db.collection(DISPUTES_COLLECTION).doc(disputeId).update({
        status: 'escalated',
        escalatedReason: reason,
        escalatedAt: new Date(),
        updatedAt: new Date(),
    });

    return { ...dispute, status: 'escalated' };
};
