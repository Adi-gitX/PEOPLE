// Advanced Matching Algorithm Utilities
// Machine Learning-ready features and advanced scoring

import type { ContributorProfile, ContributorSkill, Mission } from '../../types/firestore.js';
import type { WorkHistory, MatchResult } from './matching.types.js';

// ─── Feature Vector for ML Model ─────────────────────────────────────────────

export interface FeatureVector {
    // Contributor features (normalized 0-1)
    f_matchPower: number;
    f_trustScore: number;
    f_yearsExperience: number;
    f_completedMissions: number;
    f_avgRating: number;
    f_skillCount: number;
    f_verifiedSkillCount: number;
    f_profileCompleteness: number;
    f_isLookingForWork: number;
    f_availableHours: number;

    // Mission features
    f_budgetLevel: number; // 0-1 based on budget range
    f_complexity: number;  // 0-1 based on complexity
    f_requiredSkillCount: number;
    f_durationDays: number;
    f_isFeatured: number;

    // Interaction features
    f_skillCoverage: number;
    f_skillMatchQuality: number;
    f_timezoneOverlap: number;

    // Historical interaction (would need tracking)
    f_previousApplications: number;
    f_previousHires: number;
}

export const buildFeatureVector = (
    contributor: ContributorProfile,
    mission: Mission,
    history: WorkHistory,
    matchResult: MatchResult
): FeatureVector => {
    const skills = contributor.skills || [];
    const verifiedSkills = skills.filter(s => s.verified);

    return {
        // Contributor features
        f_matchPower: (contributor.matchPower || 0) / 100,
        f_trustScore: (contributor.trustScore || 0) / 100,
        f_yearsExperience: Math.min(contributor.yearsExperience / 20, 1),
        f_completedMissions: Math.min(history.completedMissions / 50, 1),
        f_avgRating: history.averageRating / 5,
        f_skillCount: Math.min(skills.length / 10, 1),
        f_verifiedSkillCount: Math.min(verifiedSkills.length / 5, 1),
        f_profileCompleteness: calculateProfileScore(contributor) / 100,
        f_isLookingForWork: contributor.isLookingForWork ? 1 : 0,
        f_availableHours: Math.min((contributor.availabilityHoursPerWeek || 0) / 40, 1),

        // Mission features
        f_budgetLevel: normalizeBudget(mission.budgetMax || 0),
        f_complexity: complexityToNumber(mission.complexity),
        f_requiredSkillCount: Math.min((mission.requiredSkills || []).length / 10, 1),
        f_durationDays: Math.min(mission.estimatedDurationDays / 90, 1),
        f_isFeatured: mission.featured ? 1 : 0,

        // Interaction
        f_skillCoverage: matchResult.breakdown.skills.coverage / 100,
        f_skillMatchQuality: matchResult.skillScore / 100,
        f_timezoneOverlap: matchResult.timezoneFitScore / 100,

        // Historical (placeholder - would need tracking)
        f_previousApplications: 0,
        f_previousHires: 0,
    };
};

const calculateProfileScore = (profile: ContributorProfile): number => {
    let score = 0;
    if (profile.headline) score += 15;
    if (profile.bio && profile.bio.length > 50) score += 20;
    if (profile.githubUrl) score += 15;
    if (profile.linkedinUrl) score += 15;
    if (profile.portfolioUrl) score += 15;
    if (profile.timezone) score += 10;
    if (profile.skills && profile.skills.length >= 3) score += 10;
    return Math.min(score, 100);
};

const normalizeBudget = (budget: number): number => {
    if (budget >= 10000) return 1.0;
    if (budget >= 5000) return 0.8;
    if (budget >= 2000) return 0.6;
    if (budget >= 500) return 0.4;
    return 0.2;
};

const complexityToNumber = (complexity: string): number => {
    const map: Record<string, number> = {
        easy: 0.25,
        medium: 0.5,
        hard: 0.75,
        expert: 1.0,
    };
    return map[complexity] || 0.5;
};

// ─── Skill Similarity with TF-IDF-like Weighting ─────────────────────────────

export interface SkillWeight {
    skillId: string;
    weight: number; // Higher = more rare/valuable
}

export const calculateSkillWeights = async (
    allContributors: ContributorProfile[]
): Promise<Map<string, number>> => {
    const skillFrequency: Map<string, number> = new Map();
    const totalContributors = allContributors.length;

    // Count how many contributors have each skill
    for (const contributor of allContributors) {
        const skills = contributor.skills || [];
        const uniqueSkills = new Set(skills.map(s => s.skillId));
        for (const skillId of uniqueSkills) {
            skillFrequency.set(skillId, (skillFrequency.get(skillId) || 0) + 1);
        }
    }

    // Calculate IDF-like weights (rarer skills = higher weight)
    const weights: Map<string, number> = new Map();
    for (const [skillId, frequency] of skillFrequency) {
        // IDF = log(N / df)
        const idf = Math.log(totalContributors / frequency);
        // Normalize to 1-3 range
        weights.set(skillId, 1 + Math.min(idf, 2));
    }

    return weights;
};

export const calculateWeightedSkillMatch = (
    requiredSkillIds: string[],
    contributorSkills: ContributorSkill[],
    skillWeights: Map<string, number>
): number => {
    if (requiredSkillIds.length === 0) return 80;

    let totalWeight = 0;
    let matchedWeight = 0;

    for (const skillId of requiredSkillIds) {
        const weight = skillWeights.get(skillId) || 1;
        totalWeight += weight;

        const hasSkill = contributorSkills.some(s => s.skillId === skillId);
        if (hasSkill) {
            matchedWeight += weight;
        }
    }

    return totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;
};

// ─── Diversity Algorithm ─────────────────────────────────────────────────────

export interface DiversityConfig {
    maxFromSameTimezone: number;
    boostNewContributors: boolean;
    penalizeRecentHires: boolean;
}

export const applyDiversityRanking = (
    matches: MatchResult[],
    recentHires: Set<string>,
    config: DiversityConfig = {
        maxFromSameTimezone: 5,
        boostNewContributors: true,
        penalizeRecentHires: true,
    }
): MatchResult[] => {
    const result = [...matches];

    // Apply penalties and boosts
    for (const match of result) {
        // Penalize if recently hired by same initiator
        if (config.penalizeRecentHires && recentHires.has(match.contributorId)) {
            match.overallScore = Math.max(0, match.overallScore - 10);
        }

        // Boost new contributors (low completed missions)
        if (config.boostNewContributors && match.trustScore < 40) {
            match.overallScore = Math.min(100, match.overallScore + 5);
        }
    }

    // Re-sort after adjustments
    result.sort((a, b) => b.overallScore - a.overallScore);

    // Limit per timezone (diversity)
    const timezoneCounts: Map<string, number> = new Map();
    const diverseResults: MatchResult[] = [];

    for (const match of result) {
        const tz = match.breakdown?.timezoneFit?.toString() || 'unknown';
        const count = timezoneCounts.get(tz) || 0;

        if (count < config.maxFromSameTimezone) {
            diverseResults.push(match);
            timezoneCounts.set(tz, count + 1);
        }
    }

    return diverseResults;
};

// ─── Real-time Score Decay ───────────────────────────────────────────────────

export const applyTimeDecay = (
    matchResult: MatchResult,
    matchedAt: Date,
    now: Date = new Date()
): number => {
    const hoursSinceMatch = (now.getTime() - matchedAt.getTime()) / (1000 * 60 * 60);

    // Decay formula: score * e^(-λt)
    // Half-life of 72 hours (3 days)
    const lambda = Math.log(2) / 72;
    const decayFactor = Math.exp(-lambda * hoursSinceMatch);

    return Math.round(matchResult.overallScore * decayFactor);
};

// ─── Confidence Intervals ────────────────────────────────────────────────────

export interface MatchConfidence {
    score: number;
    confidence: 'high' | 'medium' | 'low';
    explanation: string;
}

export const calculateMatchConfidence = (
    match: MatchResult,
    history: WorkHistory
): MatchConfidence => {
    const factors: string[] = [];
    let confidence: 'high' | 'medium' | 'low';

    // High confidence if:
    // - Good skill coverage
    // - Has work history
    // - Profile is complete
    const skillCoverage = match.breakdown.skills.coverage;
    const hasHistory = history.completedMissions > 0;
    const trustScore = match.trustScore;

    if (skillCoverage >= 80 && hasHistory && trustScore >= 60) {
        confidence = 'high';
        factors.push('Strong skill match');
        if (hasHistory) factors.push('Proven track record');
    } else if (skillCoverage >= 50 || trustScore >= 40) {
        confidence = 'medium';
        if (skillCoverage >= 50) factors.push('Partial skill match');
        if (!hasHistory) factors.push('New contributor');
    } else {
        confidence = 'low';
        factors.push('Limited profile data');
        if (skillCoverage < 50) factors.push('Some skills missing');
    }

    return {
        score: match.overallScore,
        confidence,
        explanation: factors.join(', '),
    };
};

// ─── Batch Matching Optimization ─────────────────────────────────────────────

export interface BatchMatchConfig {
    batchSize: number;
    parallelism: number;
    cacheResults: boolean;
}

export const processBatchMatching = async <T>(
    items: T[],
    processor: (item: T) => Promise<MatchResult>,
    config: BatchMatchConfig = { batchSize: 10, parallelism: 5, cacheResults: true }
): Promise<MatchResult[]> => {
    const results: MatchResult[] = [];

    // Process in batches
    for (let i = 0; i < items.length; i += config.batchSize) {
        const batch = items.slice(i, i + config.batchSize);

        // Process batch items in parallel (up to parallelism limit)
        for (let j = 0; j < batch.length; j += config.parallelism) {
            const parallel = batch.slice(j, j + config.parallelism);
            const parallelResults = await Promise.all(parallel.map(processor));
            results.push(...parallelResults);
        }
    }

    return results;
};

// ─── Match Explanation Generator ─────────────────────────────────────────────

export const generateMatchExplanation = (match: MatchResult): string[] => {
    const reasons: string[] = [];
    const { breakdown } = match;

    // Skill analysis
    if (breakdown.skills.coverage === 100) {
        reasons.push('✅ All required skills covered');
    } else if (breakdown.skills.coverage >= 70) {
        reasons.push(`⚡ ${breakdown.skills.coverage}% skill coverage`);
    } else if (breakdown.skills.coverage >= 50) {
        reasons.push(`⚠️ Only ${breakdown.skills.coverage}% skill coverage`);
    } else {
        reasons.push(`❌ Low skill coverage (${breakdown.skills.coverage}%)`);
    }

    // Trust & reliability
    if (breakdown.trust >= 80) {
        reasons.push('⭐ Highly rated contributor');
    } else if (breakdown.trust >= 60) {
        reasons.push('👍 Good track record');
    } else if (breakdown.trust < 40) {
        reasons.push('🆕 New or limited history');
    }

    // Availability
    if (breakdown.availability >= 80) {
        reasons.push('✅ Immediately available');
    } else if (breakdown.availability < 50) {
        reasons.push('⏰ Limited availability');
    }

    // Budget
    if (breakdown.budgetFit >= 80) {
        reasons.push('💰 Great budget fit');
    } else if (breakdown.budgetFit < 50) {
        reasons.push('💸 May be outside budget expectations');
    }

    // Timezone
    if (breakdown.timezoneFit >= 80) {
        reasons.push('🌍 Same or close timezone');
    } else if (breakdown.timezoneFit < 50) {
        reasons.push('🕐 Timezone difference may affect collaboration');
    }

    return reasons;
};

// ─── Skill Gap Analysis ──────────────────────────────────────────────────────

export interface SkillGap {
    skillId: string;
    skillName: string;
    gap: 'missing' | 'underqualified' | 'needs_verification';
    severity: 'critical' | 'important' | 'nice_to_have';
}

export const analyzeSkillGaps = (
    requiredSkillIds: string[],
    contributorSkills: ContributorSkill[],
    skillNameMap: Record<string, string>
): SkillGap[] => {
    const gaps: SkillGap[] = [];
    const contributorSkillMap = new Map(contributorSkills.map(s => [s.skillId, s]));

    for (let i = 0; i < requiredSkillIds.length; i++) {
        const skillId = requiredSkillIds[i];
        const contributorSkill = contributorSkillMap.get(skillId);
        const skillName = skillNameMap[skillId] || skillId;

        // First skill is usually most important
        const severity = i === 0 ? 'critical' : i < 3 ? 'important' : 'nice_to_have';

        if (!contributorSkill) {
            gaps.push({
                skillId,
                skillName,
                gap: 'missing',
                severity,
            });
        } else if (contributorSkill.proficiencyLevel === 'beginner') {
            gaps.push({
                skillId,
                skillName,
                gap: 'underqualified',
                severity,
            });
        } else if (!contributorSkill.verified && severity === 'critical') {
            gaps.push({
                skillId,
                skillName,
                gap: 'needs_verification',
                severity,
            });
        }
    }

    return gaps;
};
