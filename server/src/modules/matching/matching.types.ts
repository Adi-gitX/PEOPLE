// Types for the Matching Engine

export interface MatchPowerFactors {
    profileCompleteness: number;  // 0-20
    skillDepth: number;           // 0-25
    verificationLevel: number;    // 0-20
    historicalPerformance: number; // 0-25
    engagementSignals: number;    // 0-10
}

export interface TrustSignals {
    completionRate: number;      // % of missions completed successfully
    averageRating: number;       // 0-5 stars
    disputeRate: number;         // % of missions with disputes
    responseTime: number;        // Average hours to respond
    onTimeDelivery: number;      // % delivered on/before deadline
    repeatClients: number;       // # of initiators who hired again
}

export interface SkillMatch {
    skillId: string;
    skillName: string;
    requiredLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    contributorLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    matchScore: number; // 0-100
    isExact: boolean;
    isUpgrade: boolean;
    verified: boolean;
}

export interface SkillMatchResult {
    score: number;
    breakdown: SkillMatch[];
    coverage: number;
    matchedCount: number;
    requiredMet: boolean;
}

export interface MatchBreakdown {
    skills: SkillMatchResult;
    trust: number;
    availability: number;
    budgetFit: number;
    timezoneFit: number;
    engagement: number;
}

export interface MatchResult {
    contributorId: string;
    contributorName?: string;
    contributorAvatar?: string;
    missionId: string;
    overallScore: number;       // 0-100
    skillScore: number;         // 0-100
    trustScore: number;         // 0-100
    availabilityScore: number;  // 0-100
    budgetFitScore: number;     // 0-100
    timezoneFitScore: number;   // 0-100
    engagementScore: number;    // 0-100
    breakdown: MatchBreakdown;
    rank: number;
    matchedAt: Date;
}

export interface RankingOptions {
    limit?: number;
    strictBudget?: boolean;
    diversityBoost?: boolean;
    recencyBoost?: boolean;
    minimumScore?: number;
}

export interface MissionRecommendation {
    missionId: string;
    missionTitle: string;
    missionBudget: { min: number; max: number };
    matchScore: number;
    skillMatch: number;
    budgetMatch: number;
    reason: string;
}

export interface WorkHistory {
    completedMissions: number;
    completionRate: number;
    averageRating: number;
    disputeRate: number;
    avgResponseTime: number;
    onTimeRate: number;
    repeatClients: number;
    totalEarnings: number;
    lastCompletedAt?: Date;
}

export interface MatchingWeights {
    skill: number;
    trust: number;
    availability: number;
    budget: number;
    timezone: number;
    engagement: number;
}

export const DEFAULT_WEIGHTS: MatchingWeights = {
    skill: 0.30,
    trust: 0.25,
    availability: 0.15,
    budget: 0.15,
    timezone: 0.10,
    engagement: 0.05,
};

export const SKILL_LEVEL_SCORES: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4,
};
