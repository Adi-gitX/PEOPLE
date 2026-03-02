// ═══════════════════════════════════════════════════════════════════
// ENHANCED PROPOSALS SERVICE
// Full-featured proposal/bid system for contributors
// ═══════════════════════════════════════════════════════════════════

import { db } from '../../config/firebase.js';
import type { Proposal, ProposedMilestone, Attachment, ScreeningAnswer } from '../../types/firestore.js';

const PROPOSALS_COLLECTION = 'proposals';
const MISSIONS_COLLECTION = 'missions';
const USERS_COLLECTION = 'users';

// ─── Create Input Types ───
export interface CreateProposalInput {
    missionId: string;
    pricingType: 'fixed' | 'hourly' | 'milestone_based';
    proposedAmount: number;
    estimatedHours?: number;
    hourlyRate?: number;
    coverLetter: string;
    proposedMilestones?: ProposedMilestone[];
    attachments?: Attachment[];
    portfolioItemIds?: string[];
    proposedDurationDays: number;
    screeningAnswers?: ScreeningAnswer[];
}

export interface UpdateProposalInput {
    proposedAmount?: number;
    coverLetter?: string;
    proposedMilestones?: ProposedMilestone[];
    attachments?: Attachment[];
    proposedDurationDays?: number;
}

// ═══════════════════════════════════════════════════════════════════
// PROPOSAL CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a new proposal
 */
export const createProposal = async (
    contributorId: string,
    data: CreateProposalInput
): Promise<Proposal> => {
    const now = new Date();

    // Check if contributor already has a proposal for this mission
    const existingProposal = await getProposalByMissionAndContributor(data.missionId, contributorId);
    if (existingProposal) {
        throw new Error('You already have a proposal for this mission');
    }

    // Get contributor name
    const userDoc = await db.collection(USERS_COLLECTION).doc(contributorId).get();
    const contributorName = userDoc.exists ? userDoc.data()?.fullName || 'Unknown' : 'Unknown';

    const proposal: Omit<Proposal, 'id'> = {
        missionId: data.missionId,
        contributorId,
        contributorName,

        // Pricing
        pricingType: data.pricingType,
        proposedAmount: data.proposedAmount,
        estimatedHours: data.estimatedHours,
        hourlyRate: data.hourlyRate,

        // Content
        coverLetter: data.coverLetter,
        proposedMilestones: data.proposedMilestones || [],
        attachments: data.attachments || [],
        portfolioItemIds: data.portfolioItemIds || [],

        // Timeline
        proposedDurationDays: data.proposedDurationDays,

        // Screening
        screeningAnswers: data.screeningAnswers || [],

        // Boosting
        isBoosted: false,

        // Status
        status: 'submitted',

        createdAt: now,
        updatedAt: now,
    };

    const docRef = await db.collection(PROPOSALS_COLLECTION).add(proposal);

    // Update proposal count on mission
    const proposalCount = (await db.collection(PROPOSALS_COLLECTION)
        .where('missionId', '==', data.missionId)
        .count()
        .get()).data().count;

    await db.collection(MISSIONS_COLLECTION).doc(data.missionId).update({
        proposalCount,
        lastActivityAt: now,
    });

    return { id: docRef.id, ...proposal };
};

/**
 * Get proposal by ID
 */
export const getProposalById = async (proposalId: string): Promise<Proposal | null> => {
    const doc = await db.collection(PROPOSALS_COLLECTION).doc(proposalId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Proposal;
};

/**
 * Get proposal by mission and contributor
 */
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

/**
 * Get all proposals for a mission
 */
export const getMissionProposals = async (missionId: string): Promise<Proposal[]> => {
    const snapshot = await db
        .collection(PROPOSALS_COLLECTION)
        .where('missionId', '==', missionId)
        .get();

    const proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proposal));

    // Sort by: boosted first, then by createdAt descending
    return proposals.sort((a, b) => {
        if (a.isBoosted !== b.isBoosted) {
            return a.isBoosted ? -1 : 1;
        }
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
        return dateB - dateA;
    });
};

/**
 * Get proposals by contributor
 */
export const getContributorProposals = async (contributorId: string): Promise<Proposal[]> => {
    const snapshot = await db
        .collection(PROPOSALS_COLLECTION)
        .where('contributorId', '==', contributorId)
        .get();

    const proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proposal));

    // Sort by createdAt descending
    return proposals.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
        return dateB - dateA;
    });
};

/**
 * Update proposal
 */
export const updateProposal = async (
    proposalId: string,
    contributorId: string,
    data: UpdateProposalInput
): Promise<Proposal> => {
    const proposal = await getProposalById(proposalId);
    if (!proposal) {
        throw new Error('Proposal not found');
    }

    if (proposal.contributorId !== contributorId) {
        throw new Error('Not authorized to update this proposal');
    }

    if (proposal.status !== 'submitted' && proposal.status !== 'draft') {
        throw new Error('Cannot update proposal in current status');
    }

    const updateData: Partial<Proposal> = {
        ...data,
        updatedAt: new Date(),
    };

    await db.collection(PROPOSALS_COLLECTION).doc(proposalId).update(updateData);

    return { ...proposal, ...updateData };
};

// ═══════════════════════════════════════════════════════════════════
// STATUS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Mark proposal as viewed
 */
export const markProposalAsViewed = async (proposalId: string): Promise<void> => {
    const proposal = await getProposalById(proposalId);
    if (!proposal) return;

    if (proposal.status === 'submitted') {
        await db.collection(PROPOSALS_COLLECTION).doc(proposalId).update({
            status: 'viewed',
            viewedAt: new Date(),
            updatedAt: new Date(),
        });
    }
};

/**
 * Shortlist proposal
 */
export const shortlistProposal = async (proposalId: string): Promise<Proposal> => {
    const proposal = await getProposalById(proposalId);
    if (!proposal) {
        throw new Error('Proposal not found');
    }

    await db.collection(PROPOSALS_COLLECTION).doc(proposalId).update({
        status: 'shortlisted',
        updatedAt: new Date(),
    });

    return { ...proposal, status: 'shortlisted' };
};

/**
 * Schedule interview for proposal
 */
export const scheduleInterview = async (
    proposalId: string,
    interviewDate: Date,
    notes?: string
): Promise<Proposal> => {
    const proposal = await getProposalById(proposalId);
    if (!proposal) {
        throw new Error('Proposal not found');
    }

    await db.collection(PROPOSALS_COLLECTION).doc(proposalId).update({
        status: 'interview',
        interviewScheduledAt: interviewDate,
        interviewNotes: notes,
        updatedAt: new Date(),
    });

    return { ...proposal, status: 'interview', interviewScheduledAt: interviewDate };
};

/**
 * Accept proposal (and reject others)
 */
export const acceptProposal = async (proposalId: string): Promise<Proposal> => {
    const proposal = await getProposalById(proposalId);
    if (!proposal) {
        throw new Error('Proposal not found');
    }

    const now = new Date();

    // Update this proposal to accepted
    await db.collection(PROPOSALS_COLLECTION).doc(proposalId).update({
        status: 'accepted',
        respondedAt: now,
        updatedAt: now,
    });

    // Reject all other pending/shortlisted/interview proposals for this mission
    const otherProposals = await db
        .collection(PROPOSALS_COLLECTION)
        .where('missionId', '==', proposal.missionId)
        .where('status', 'in', ['submitted', 'viewed', 'shortlisted', 'interview'])
        .get();

    const batch = db.batch();
    otherProposals.docs.forEach(doc => {
        if (doc.id !== proposalId) {
            batch.update(doc.ref, { status: 'rejected', respondedAt: now, updatedAt: now });
        }
    });
    await batch.commit();

    // Update mission status
    await db.collection(MISSIONS_COLLECTION).doc(proposal.missionId).update({
        status: 'in_progress',
        acceptedProposalId: proposalId,
        acceptedAmount: proposal.proposedAmount,
        assignedContributorId: proposal.contributorId,
        startedAt: now,
        updatedAt: now,
    });

    return { ...proposal, status: 'accepted' };
};

/**
 * Reject proposal
 */
export const rejectProposal = async (proposalId: string): Promise<Proposal> => {
    const proposal = await getProposalById(proposalId);
    if (!proposal) {
        throw new Error('Proposal not found');
    }

    await db.collection(PROPOSALS_COLLECTION).doc(proposalId).update({
        status: 'rejected',
        respondedAt: new Date(),
        updatedAt: new Date(),
    });

    return { ...proposal, status: 'rejected' };
};

/**
 * Withdraw proposal
 */
export const withdrawProposal = async (
    proposalId: string,
    contributorId: string
): Promise<void> => {
    const proposal = await getProposalById(proposalId);
    if (!proposal) {
        throw new Error('Proposal not found');
    }

    if (proposal.contributorId !== contributorId) {
        throw new Error('Not authorized to withdraw this proposal');
    }

    if (proposal.status === 'accepted') {
        throw new Error('Cannot withdraw accepted proposal');
    }

    await db.collection(PROPOSALS_COLLECTION).doc(proposalId).update({
        status: 'withdrawn',
        updatedAt: new Date(),
    });
};

// ═══════════════════════════════════════════════════════════════════
// BOOSTING (Premium Feature)
// ═══════════════════════════════════════════════════════════════════

/**
 * Boost proposal (premium feature)
 */
export const boostProposal = async (
    proposalId: string,
    contributorId: string,
    durationDays: number = 7
): Promise<Proposal> => {
    const proposal = await getProposalById(proposalId);
    if (!proposal) {
        throw new Error('Proposal not found');
    }

    if (proposal.contributorId !== contributorId) {
        throw new Error('Not authorized to boost this proposal');
    }

    const boostExpiresAt = new Date();
    boostExpiresAt.setDate(boostExpiresAt.getDate() + durationDays);

    await db.collection(PROPOSALS_COLLECTION).doc(proposalId).update({
        isBoosted: true,
        boostExpiresAt,
        updatedAt: new Date(),
    });

    // TODO: Deduct credits from user's account

    return { ...proposal, isBoosted: true, boostExpiresAt };
};

// ═══════════════════════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get proposal statistics for a mission
 */
export const getMissionProposalStats = async (missionId: string): Promise<{
    total: number;
    submitted: number;
    viewed: number;
    shortlisted: number;
    interview: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
    averageBid: number;
    minBid: number;
    maxBid: number;
}> => {
    const proposals = await getMissionProposals(missionId);

    const stats = {
        total: proposals.length,
        submitted: proposals.filter(p => p.status === 'submitted').length,
        viewed: proposals.filter(p => p.status === 'viewed').length,
        shortlisted: proposals.filter(p => p.status === 'shortlisted').length,
        interview: proposals.filter(p => p.status === 'interview').length,
        accepted: proposals.filter(p => p.status === 'accepted').length,
        rejected: proposals.filter(p => p.status === 'rejected').length,
        withdrawn: proposals.filter(p => p.status === 'withdrawn').length,
        averageBid: 0,
        minBid: 0,
        maxBid: 0,
    };

    const activeProposals = proposals.filter(p =>
        !['rejected', 'withdrawn'].includes(p.status)
    );

    if (activeProposals.length > 0) {
        const amounts = activeProposals.map(p => p.proposedAmount);
        stats.averageBid = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length);
        stats.minBid = Math.min(...amounts);
        stats.maxBid = Math.max(...amounts);
    }

    return stats;
};

/**
 * Get contributor's proposal statistics
 */
export const getContributorProposalStats = async (contributorId: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
    successRate: number;
}> => {
    const proposals = await getContributorProposals(contributorId);

    const total = proposals.length;
    const accepted = proposals.filter(p => p.status === 'accepted').length;
    const rejected = proposals.filter(p => p.status === 'rejected').length;
    const responded = accepted + rejected;

    return {
        total,
        pending: proposals.filter(p => ['submitted', 'viewed', 'shortlisted', 'interview'].includes(p.status)).length,
        accepted,
        rejected,
        withdrawn: proposals.filter(p => p.status === 'withdrawn').length,
        successRate: responded > 0 ? Math.round((accepted / responded) * 100) : 0,
    };
};
