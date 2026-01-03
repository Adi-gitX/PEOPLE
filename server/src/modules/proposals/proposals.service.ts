// Proposals Service
// Handles custom proposals/bids from contributors to initiators

import { db } from '../../config/firebase.js';

const PROPOSALS_COLLECTION = 'proposals';
const MISSIONS_COLLECTION = 'missions';

export interface Proposal {
    id: string;
    missionId: string;
    contributorId: string;
    contributorName?: string;
    bidAmount: number;
    deliveryDays: number;
    coverLetter: string;
    milestones: ProposalMilestone[];
    status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
    createdAt: Date;
    updatedAt: Date;
}

export interface ProposalMilestone {
    title: string;
    description: string;
    amount: number;
    deliveryDays: number;
}

export interface CreateProposal {
    missionId: string;
    bidAmount: number;
    deliveryDays: number;
    coverLetter: string;
    milestones?: ProposalMilestone[];
}

// Create a new proposal
export const createProposal = async (
    contributorId: string,
    data: CreateProposal
): Promise<Proposal> => {
    // Check if contributor already has a proposal for this mission
    const existingProposal = await getProposalByMissionAndContributor(data.missionId, contributorId);
    if (existingProposal) {
        throw new Error('You already have a proposal for this mission');
    }

    const proposal: Omit<Proposal, 'id'> = {
        missionId: data.missionId,
        contributorId,
        bidAmount: data.bidAmount,
        deliveryDays: data.deliveryDays,
        coverLetter: data.coverLetter,
        milestones: data.milestones || [],
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const docRef = await db.collection(PROPOSALS_COLLECTION).add(proposal);

    // Increment proposal count on mission
    await db.collection(MISSIONS_COLLECTION).doc(data.missionId).update({
        proposalCount: (await db.collection(PROPOSALS_COLLECTION)
            .where('missionId', '==', data.missionId)
            .count()
            .get()).data().count,
    });

    return { id: docRef.id, ...proposal };
};

// Get proposal by mission and contributor
export const getProposalByMissionAndContributor = async (
    missionId: string,
    contributorId: string
): Promise<Proposal | null> => {
    const snapshot = await db
        .collection(PROPOSALS_COLLECTION)
        .where('missionId', '==', missionId)
        .where('contributorId', '==', contributorId)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Proposal;
};

// Get all proposals for a mission
export const getMissionProposals = async (missionId: string): Promise<Proposal[]> => {
    const snapshot = await db
        .collection(PROPOSALS_COLLECTION)
        .where('missionId', '==', missionId)
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proposal));
};

// Get proposals by contributor
export const getContributorProposals = async (contributorId: string): Promise<Proposal[]> => {
    const snapshot = await db
        .collection(PROPOSALS_COLLECTION)
        .where('contributorId', '==', contributorId)
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proposal));
};

// Update proposal status
export const updateProposalStatus = async (
    proposalId: string,
    status: Proposal['status']
): Promise<void> => {
    await db.collection(PROPOSALS_COLLECTION).doc(proposalId).update({
        status,
        updatedAt: new Date(),
    });
};

// Accept proposal (and reject others)
export const acceptProposal = async (proposalId: string): Promise<Proposal> => {
    const proposalDoc = await db.collection(PROPOSALS_COLLECTION).doc(proposalId).get();
    if (!proposalDoc.exists) {
        throw new Error('Proposal not found');
    }

    const proposal = { id: proposalDoc.id, ...proposalDoc.data() } as Proposal;

    // Update this proposal to accepted
    await db.collection(PROPOSALS_COLLECTION).doc(proposalId).update({
        status: 'accepted',
        updatedAt: new Date(),
    });

    // Reject all other proposals for this mission
    const otherProposals = await db
        .collection(PROPOSALS_COLLECTION)
        .where('missionId', '==', proposal.missionId)
        .where('status', '==', 'pending')
        .get();

    const batch = db.batch();
    otherProposals.docs.forEach(doc => {
        if (doc.id !== proposalId) {
            batch.update(doc.ref, { status: 'rejected', updatedAt: new Date() });
        }
    });
    await batch.commit();

    // Update mission status
    await db.collection(MISSIONS_COLLECTION).doc(proposal.missionId).update({
        status: 'in_progress',
        acceptedBid: proposal.bidAmount,
        assignedContributorId: proposal.contributorId,
    });

    return { ...proposal, status: 'accepted' };
};

// Withdraw proposal
export const withdrawProposal = async (
    proposalId: string,
    contributorId: string
): Promise<void> => {
    const proposalDoc = await db.collection(PROPOSALS_COLLECTION).doc(proposalId).get();
    if (!proposalDoc.exists) {
        throw new Error('Proposal not found');
    }

    const proposal = proposalDoc.data();
    if (proposal?.contributorId !== contributorId) {
        throw new Error('Not authorized to withdraw this proposal');
    }

    if (proposal?.status !== 'pending') {
        throw new Error('Can only withdraw pending proposals');
    }

    await db.collection(PROPOSALS_COLLECTION).doc(proposalId).update({
        status: 'withdrawn',
        updatedAt: new Date(),
    });
};

// Get proposal by ID
export const getProposalById = async (proposalId: string): Promise<Proposal | null> => {
    const doc = await db.collection(PROPOSALS_COLLECTION).doc(proposalId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Proposal;
};
