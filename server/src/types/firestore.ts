// ═══════════════════════════════════════════════════════════════════
// FIRESTORE DATA TYPES
// ═══════════════════════════════════════════════════════════════════

import { Timestamp } from 'firebase-admin/firestore';

// ─── Base Types ───
export interface FirestoreDocument {
    id?: string;
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp | Date;
}

// ─── User ───
export interface User extends FirestoreDocument {
    email: string;
    emailVerified: boolean;
    fullName: string;
    avatarUrl?: string;
    primaryRole: 'contributor' | 'initiator' | 'admin';
    accountStatus: 'active' | 'suspended' | 'banned' | 'pending_verification';
    lastLoginAt?: Timestamp | Date;
}

// ─── Contributor Profile ───
export interface ContributorProfile extends FirestoreDocument {
    userId: string;

    // Verification
    verificationStatus: 'pending' | 'proof_task_submitted' | 'verified' | 'rejected';
    verificationDate?: Timestamp | Date;

    // Availability
    isLookingForWork: boolean;
    availabilityHoursPerWeek: number;
    timezone?: string;

    // Professional Info
    headline?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    yearsExperience: number;

    // Scores (0-100)
    trustScore: number;
    matchPower: number;
    completionRate: number;

    // Statistics
    totalMissionsCompleted: number;
    totalEarnings: number;
    shadowAssignments: number;

    // Skills (array of skill IDs)
    skills: ContributorSkill[];

    // Background Check
    backgroundCheckStatus: 'not_started' | 'in_progress' | 'passed' | 'failed';
    backgroundCheckDate?: Timestamp | Date;
}

export interface ContributorSkill {
    skillId: string;
    skillName: string;
    proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsExperience: number;
    verified: boolean;
}

// ─── Initiator Profile ───
export interface InitiatorProfile extends FirestoreDocument {
    userId: string;

    // Organization Info
    companyName?: string;
    companyUrl?: string;
    companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
    industry?: string;

    // Verification
    isVerified: boolean;
    verificationDate?: Timestamp | Date;

    // Statistics
    totalMissionsPosted: number;
    totalSpent: number;
    averageRating: number;

    // Payment Info (Stripe)
    stripeCustomerId?: string;
    defaultPaymentMethodId?: string;
}

// ─── Skill ───
export interface Skill extends FirestoreDocument {
    name: string;
    category: 'language' | 'framework' | 'tool' | 'database' | 'cloud' | 'design' | 'other';
    iconUrl?: string;
    isActive: boolean;
}

// ─── Mission ───
export interface Mission extends FirestoreDocument {
    initiatorId: string;
    initiatorName?: string;

    // Basic Info
    title: string;
    slug: string;
    description: string;
    problemStatement?: string;
    successCriteria?: string;

    // Classification
    type: 'algorithm' | 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'devops' | 'design' | 'qa' | 'security' | 'data' | 'other';
    complexity: 'easy' | 'medium' | 'hard' | 'expert';

    // Budget & Timeline
    budgetMin: number;
    budgetMax: number;
    estimatedDurationDays: number;
    deadline?: Timestamp | Date;

    // Team Structure
    maxLeadContributors: number;
    maxShadowContributors: number;
    requiresCoreReviewer: boolean;

    // Status
    status: 'draft' | 'pending_funding' | 'open' | 'matching' | 'in_progress' | 'in_review' | 'completed' | 'cancelled' | 'disputed';

    // Visibility
    isPublic: boolean;
    featured: boolean;

    // Required Skills
    requiredSkills: string[]; // Skill IDs

    // Dates
    publishedAt?: Timestamp | Date;
    startedAt?: Timestamp | Date;
    completedAt?: Timestamp | Date;
}

// ─── Milestone ───
export interface Milestone extends FirestoreDocument {
    missionId: string;

    title: string;
    description?: string;
    orderIndex: number;
    amount: number;

    status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'revision' | 'paid';

    dueDate?: Timestamp | Date;
    submittedAt?: Timestamp | Date;
    approvedAt?: Timestamp | Date;
    paidAt?: Timestamp | Date;
}

// ─── Mission Assignment ───
export interface MissionAssignment extends FirestoreDocument {
    missionId: string;
    contributorId: string;
    contributorName?: string;

    role: 'lead' | 'shadow' | 'core_reviewer';
    status: 'invited' | 'active' | 'stepped_up' | 'completed' | 'withdrawn' | 'removed';

    rating?: number; // 0.00 to 5.00
    reviewText?: string;

    assignedAt: Timestamp | Date;
    acceptedAt?: Timestamp | Date;
    completedAt?: Timestamp | Date;
}

// ─── Mission Application ───
export interface MissionApplication extends FirestoreDocument {
    missionId: string;
    contributorId: string;
    contributorName?: string;

    coverLetter?: string;
    proposedTimeline?: number; // days
    proposedApproach?: string;

    matchScore?: number; // Algorithm-calculated

    status: 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';
    reviewedAt?: Timestamp | Date;
}

// ─── Notification ───
export interface Notification extends FirestoreDocument {
    userId: string;

    type: string;
    title: string;
    message: string;

    priority: 'basic' | 'medium' | 'urgent' | 'final';

    actionUrl?: string;
    actionLabel?: string;

    isRead: boolean;
    isArchived: boolean;

    metadata?: Record<string, unknown>;
    expiresAt?: Timestamp | Date;
    readAt?: Timestamp | Date;
}

// ─── Review ───
export interface Review extends FirestoreDocument {
    missionId: string;
    reviewerId: string;
    revieweeId: string;

    rating: number; // 0-5
    comment?: string;

    isPublic: boolean;
}

// ─── Escrow Transaction ───
export interface EscrowTransaction extends FirestoreDocument {
    missionId: string;
    milestoneId?: string;
    initiatorId: string;
    contributorId?: string;

    type: 'deposit' | 'release' | 'refund' | 'platform_fee' | 'dispute_hold' | 'dispute_release';

    amount: number;
    currency: string;

    stripePaymentIntentId?: string;
    stripeTransferId?: string;

    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    description?: string;
    processedAt?: Timestamp | Date;
}

// ─── Proof Task ───
export interface ProofTask extends FirestoreDocument {
    title: string;
    scenario: string;
    expectedApproach?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    timeLimitMinutes: number;
    category?: string;
    isActive: boolean;
}

export interface ProofTaskSubmission extends FirestoreDocument {
    contributorId: string;
    taskId: string;

    answer: string;
    timeTakenSeconds?: number;

    score?: number; // 0-100
    feedback?: string;
    evaluatedBy?: string;

    status: 'submitted' | 'under_review' | 'passed' | 'failed';
    evaluatedAt?: Timestamp | Date;
}

// ─── Conversation & Message ───
export interface Conversation extends FirestoreDocument {
    missionId?: string; // Optional, for mission-specific chats
    type: 'direct' | 'mission_team' | 'support';
    participants: string[]; // User IDs
    lastMessageAt?: Timestamp | Date;
}

export interface Message extends FirestoreDocument {
    conversationId: string;
    senderId: string;
    senderName?: string;

    content: string;
    messageType: 'text' | 'file' | 'system';

    attachments?: {
        url: string;
        type: string;
        name: string;
        size?: number;
    }[];

    isEdited: boolean;
    isDeleted: boolean;
    editedAt?: Timestamp | Date;
}
