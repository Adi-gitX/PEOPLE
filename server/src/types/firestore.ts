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

    readBy?: string[];

    isEdited: boolean;
    isDeleted: boolean;
    editedAt?: Timestamp | Date;
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 1: ENHANCED TYPES
// ═══════════════════════════════════════════════════════════════════

// ─── Escrow Account ───
export interface EscrowAccount extends FirestoreDocument {
    missionId: string;
    initiatorId: string;

    // Balances
    totalFunded: number;
    totalReleased: number;
    totalRefunded: number;
    balance: number; // Available for release
    holdAmount: number; // In dispute
    platformFee: number;

    // Currency
    currency: string;

    // Stripe References
    stripePaymentIntentIds: string[];
    stripeTransferIds: string[];

    // Status
    status: 'pending_funding' | 'funded' | 'partially_released' | 'completed' | 'disputed' | 'refunded';

    // Auto-release settings
    autoReleaseEnabled: boolean;
    autoReleaseDays: number; // Days after submission

    fundedAt?: Timestamp | Date;
    completedAt?: Timestamp | Date;
}

// ─── Payment Schedule ───
export interface PaymentSchedule extends FirestoreDocument {
    missionId: string;
    escrowAccountId: string;

    milestones: MilestonePayment[];

    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
}

export interface MilestonePayment {
    milestoneId: string;
    title: string;
    amount: number;
    dueDate?: Timestamp | Date;
    status: 'pending' | 'funded' | 'in_escrow' | 'released' | 'disputed' | 'refunded';
    releasedAt?: Timestamp | Date;
}

// ─── Enhanced Proposal ───
export interface Proposal extends FirestoreDocument {
    missionId: string;
    contributorId: string;
    contributorName?: string;

    // Pricing
    pricingType: 'fixed' | 'hourly' | 'milestone_based';
    proposedAmount: number;
    estimatedHours?: number;
    hourlyRate?: number;

    // Content
    coverLetter: string;
    proposedMilestones: ProposedMilestone[];
    attachments: Attachment[];
    portfolioItemIds: string[]; // Portfolio IDs to showcase

    // Timeline
    proposedStartDate?: Timestamp | Date;
    proposedDurationDays: number;

    // Questions/Answers
    screeningAnswers?: ScreeningAnswer[];

    // Boosting (Premium feature)
    isBoosted: boolean;
    boostExpiresAt?: Timestamp | Date;

    // Status
    status: 'draft' | 'submitted' | 'viewed' | 'shortlisted' | 'interview' | 'accepted' | 'rejected' | 'withdrawn';
    viewedAt?: Timestamp | Date;
    respondedAt?: Timestamp | Date;

    // Interview
    interviewScheduledAt?: Timestamp | Date;
    interviewNotes?: string;
}

export interface ProposedMilestone {
    title: string;
    description: string;
    amount: number;
    estimatedDays: number;
    deliverables: string[];
}

export interface Attachment {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Timestamp | Date;
}

export interface ScreeningAnswer {
    questionId: string;
    question: string;
    answer: string;
}

// ─── Screening Questions (Mission Feature) ───
export interface ScreeningQuestion {
    id: string;
    question: string;
    type: 'text' | 'choice' | 'yes_no';
    required: boolean;
    options?: string[]; // For choice type
}

// ─── User Tier & Badges ───
export interface UserTier extends FirestoreDocument {
    userId: string;
    role: 'contributor' | 'initiator';

    // Contributor Tiers
    contributorTier?: 'new' | 'rising_talent' | 'top_rated' | 'top_rated_plus' | 'expert';
    tierScore: number;
    tierAwardedAt?: Timestamp | Date;
    tierExpiresAt?: Timestamp | Date;

    // Initiator Tiers
    initiatorTier?: 'new' | 'established' | 'premium' | 'enterprise';

    // Badges
    badges: UserBadge[];

    // Metrics for tier calculation
    jobSuccessScore: number; // 0-100
    earningsLast12Months: number;
    activeWeeksLast12Months: number;
    longTermClients: number;
    onTimeDeliveryRate: number;
    responseRate: number;
}

export interface UserBadge {
    type: 'top_rated' | 'rising_talent' | 'fast_responder' | 'on_time_delivery' | 'skill_certified' | 'enterprise_client' | 'verified';
    awardedAt: Timestamp | Date;
    expiresAt?: Timestamp | Date;
}

// ─── Profile Completeness ───
export interface ProfileCompleteness extends FirestoreDocument {
    userId: string;
    role: 'contributor' | 'initiator';

    score: number; // 0-100

    // Completion status per section
    sections: ProfileSection[];

    // Tips for improvement
    suggestions: string[];

    lastCalculatedAt: Timestamp | Date;
}

export interface ProfileSection {
    name: string;
    weight: number; // Importance weight
    completed: boolean;
    completionPercentage: number;
    missingFields: string[];
}

// ─── Gig/Service Package (Phase 2 Preview) ───
export interface Gig extends FirestoreDocument {
    contributorId: string;

    // Basic Info
    title: string;
    slug: string;
    description: string;
    category: string;
    subcategory: string;
    tags: string[];

    // Media
    images: string[];
    videoUrl?: string;

    // Packages
    packages: GigPackage[];
    extras: GigExtra[];

    // Metrics
    impressions: number;
    clicks: number;
    orders: number;
    rating: number;
    reviewCount: number;

    // Status
    status: 'draft' | 'pending_review' | 'active' | 'paused' | 'denied';
    featured: boolean;

    // Delivery
    averageDeliveryTime: number; // days
}

export interface GigPackage {
    tier: 'basic' | 'standard' | 'premium';
    name: string;
    description: string;
    price: number;
    deliveryDays: number;
    revisions: number;
    features: string[];
}

export interface GigExtra {
    id: string;
    title: string;
    description: string;
    price: number;
    deliveryDays: number; // Additional days
}

// ─── Gig Order ───
export interface GigOrder extends FirestoreDocument {
    gigId: string;
    buyerId: string;
    sellerId: string;

    package: 'basic' | 'standard' | 'premium';
    selectedExtras: string[]; // Extra IDs

    requirements: string;
    requirementAttachments: Attachment[];

    totalPrice: number;
    platformFee: number;
    sellerEarnings: number;

    deliveryDeadline: Timestamp | Date;

    status: 'pending_requirements' | 'in_progress' | 'delivered' | 'revision' | 'completed' | 'cancelled' | 'disputed';

    deliveries: GigDelivery[];
    revisionCount: number;
    maxRevisions: number;

    completedAt?: Timestamp | Date;
    cancelledAt?: Timestamp | Date;
}

export interface GigDelivery {
    id: string;
    message: string;
    files: Attachment[];
    deliveredAt: Timestamp | Date;
    status: 'delivered' | 'accepted' | 'revision_requested';
    revisionMessage?: string;
}

// ─── Time Tracking (Phase 2) ───
export interface TimeEntry extends FirestoreDocument {
    missionId: string;
    milestoneId?: string;
    contributorId: string;

    // Time
    startTime: Timestamp | Date;
    endTime: Timestamp | Date;
    duration: number; // minutes

    // Activity
    activityLevel: number; // 0-100%
    screenshots: TimeScreenshot[];

    // Memo
    memo: string;
    isManual: boolean;
    manualReason?: string;

    // Billing
    hourlyRate: number;
    billableAmount: number;
    billingWeek: string; // YYYY-WW format
    status: 'pending' | 'approved' | 'disputed' | 'paid';
}

export interface TimeScreenshot {
    url: string;
    takenAt: Timestamp | Date;
    activityLevel: number;
    blurred: boolean;
}

// ─── Withdrawal Request (Enhanced) ───
export interface WithdrawalRequest extends FirestoreDocument {
    userId: string;

    amount: number;
    currency: string;

    // Payout Method
    payoutMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'payoneer';
    payoutDetails: Record<string, string>;

    // Processing
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    stripePayoutId?: string;
    transactionId?: string;

    // Fees
    platformFee: number;
    processingFee: number;
    netAmount: number;

    processedAt?: Timestamp | Date;
    failureReason?: string;
}

// ─── Wallet/Balance ───
export interface UserWallet extends FirestoreDocument {
    userId: string;

    // Balances
    availableBalance: number;
    pendingBalance: number;
    totalEarnings: number;
    totalWithdrawn: number;

    // Currency
    currency: string;

    // Stripe Connect
    stripeConnectAccountId?: string;
    stripeConnectStatus: 'not_started' | 'pending' | 'active' | 'restricted';
    stripePayoutsEnabled: boolean;

    lastTransactionAt?: Timestamp | Date;
}

export interface WalletTransaction extends FirestoreDocument {
    userId: string;
    walletId: string;

    type: 'earning' | 'withdrawal' | 'refund' | 'bonus' | 'fee' | 'adjustment';

    amount: number;
    balanceAfter: number;

    description: string;
    referenceType?: 'mission' | 'milestone' | 'gig_order' | 'withdrawal' | 'dispute';
    referenceId?: string;

    status: 'pending' | 'completed' | 'failed' | 'reversed';
}

// ─── Saved Search & Alerts ───
export interface SavedSearch extends FirestoreDocument {
    userId: string;

    name: string;
    searchType: 'missions' | 'contributors' | 'gigs';

    query?: string;
    filters: SearchFilters;

    alertEnabled: boolean;
    alertFrequency: 'instant' | 'daily' | 'weekly';
    lastAlertSentAt?: Timestamp | Date;

    resultCount?: number;
    lastSearchedAt?: Timestamp | Date;
}

export interface SearchFilters {
    // Mission filters
    budgetMin?: number;
    budgetMax?: number;
    complexity?: string[];
    missionType?: string[];
    skills?: string[];
    durationMin?: number;
    durationMax?: number;

    // Contributor filters
    hourlyRateMin?: number;
    hourlyRateMax?: number;
    availability?: string;
    timezone?: string[];
    languages?: string[];
    minRating?: number;
    minJobSuccessRate?: number;
    tier?: string[];

    // Common
    location?: string;
    verified?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// ─── Referral System ───
export interface ReferralProgram extends FirestoreDocument {
    userId: string;

    referralCode: string;
    referralLink: string;

    totalReferrals: number;
    successfulReferrals: number;

    earningsFromReferrals: number;
    pendingRewards: number;
    paidRewards: number;
}

export interface Referral extends FirestoreDocument {
    referrerId: string;
    referredUserId: string;

    status: 'signed_up' | 'profile_complete' | 'first_project' | 'qualified' | 'rewarded';

    rewardAmount?: number;
    rewardPaidAt?: Timestamp | Date;

    qualifiedAt?: Timestamp | Date;
}
