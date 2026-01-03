// Scoring Functions for the Matching Engine

import type { ContributorProfile, ContributorSkill } from '../../types/firestore.js';
import type {
    MatchPowerFactors,
    TrustSignals,
    SkillMatch,
    SkillMatchResult,
    WorkHistory,
} from './matching.types.js';

// ─── Match Power Calculation ─────────────────────────────────────────────────

export const calculateMatchPower = (
    profile: ContributorProfile,
    history: WorkHistory
): { score: number; factors: MatchPowerFactors } => {
    const factors: MatchPowerFactors = {
        profileCompleteness: calculateProfileCompleteness(profile),
        skillDepth: calculateSkillDepth(profile.skills || []),
        verificationLevel: calculateVerificationLevel(profile),
        historicalPerformance: calculateHistoricalPerformance(history),
        engagementSignals: calculateEngagementSignals(profile),
    };

    const weights = {
        profileCompleteness: 0.20,
        skillDepth: 0.25,
        verificationLevel: 0.20,
        historicalPerformance: 0.25,
        engagementSignals: 0.10,
    };

    let score = 0;
    for (const [key, weight] of Object.entries(weights)) {
        score += factors[key as keyof MatchPowerFactors] * weight;
    }

    return { score: Math.round(score), factors };
};

export const calculateProfileCompleteness = (profile: ContributorProfile): number => {
    let score = 0;

    // Basic info (30 points)
    if (profile.headline && profile.headline.length > 10) score += 10;
    if (profile.bio && profile.bio.length > 50) score += 15;
    score += 5; // avatarUrl handled by user

    // Links (25 points)
    if (profile.githubUrl) score += 10;
    if (profile.linkedinUrl) score += 8;
    if (profile.portfolioUrl) score += 7;

    // Professional info (25 points)
    if (profile.yearsExperience > 0) score += 10;
    if (profile.timezone) score += 8;
    score += 7; // rate handled separately

    // Availability (20 points)
    if (profile.isLookingForWork) score += 10;
    if (profile.availabilityHoursPerWeek && profile.availabilityHoursPerWeek > 0) score += 10;

    return Math.min(score, 100);
};

export const calculateSkillDepth = (skills: ContributorSkill[]): number => {
    if (skills.length === 0) return 0;

    let score = 0;

    // Quantity (up to 30 points)
    score += Math.min(skills.length * 5, 30);

    // Quality - proficiency levels (up to 40 points)
    const levelScores: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const avgLevel = skills.reduce((sum, s) => sum + (levelScores[s.proficiencyLevel] || 1), 0) / skills.length;
    score += (avgLevel / 4) * 40;

    // Verified skills bonus (up to 20 points)
    const verifiedCount = skills.filter(s => s.verified).length;
    score += Math.min(verifiedCount * 5, 20);

    // Experience years (up to 10 points)
    const avgYears = skills.reduce((sum, s) => sum + (s.yearsExperience || 0), 0) / skills.length;
    score += Math.min(avgYears * 2, 10);

    return Math.min(score, 100);
};

export const calculateVerificationLevel = (profile: ContributorProfile): number => {
    let score = 0;

    switch (profile.verificationStatus) {
        case 'verified': score += 50; break;
        case 'proof_task_submitted': score += 30; break;
        case 'pending': score += 10; break;
        default: score += 0;
    }

    switch (profile.backgroundCheckStatus) {
        case 'passed': score += 30; break;
        case 'in_progress': score += 15; break;
        default: score += 0;
    }

    return Math.min(score, 100);
};

export const calculateHistoricalPerformance = (history: WorkHistory): number => {
    if (history.completedMissions === 0) {
        return 30; // New contributors get baseline score
    }

    let score = 0;
    score += history.completionRate * 30;
    score += (history.averageRating / 5) * 25;
    score += (1 - history.disputeRate) * 15;
    score += history.onTimeRate * 15;
    score += Math.min(history.repeatClients * 2, 10);
    score += Math.min(history.completedMissions / 10, 5);

    return Math.min(score, 100);
};

export const calculateEngagementSignals = (profile: ContributorProfile): number => {
    let score = 50;

    if (profile.updatedAt) {
        const updatedDate = profile.updatedAt instanceof Date
            ? profile.updatedAt
            : (profile.updatedAt as any).toDate?.() || new Date();
        const daysSinceUpdate = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceUpdate <= 7) score += 30;
        else if (daysSinceUpdate <= 14) score += 20;
        else if (daysSinceUpdate <= 30) score += 10;
        else score -= 20;
    }

    if (profile.isLookingForWork) score += 20;

    return Math.max(0, Math.min(score, 100));
};

// ─── Trust Score Calculation ─────────────────────────────────────────────────

export const calculateTrustScore = (signals: TrustSignals): number => {
    const weights = {
        completionRate: 0.25,
        averageRating: 0.25,
        disputeRate: 0.15,
        responseTime: 0.10,
        onTimeDelivery: 0.15,
        repeatClients: 0.10,
    };

    const normalized = {
        completionRate: signals.completionRate * 100,
        averageRating: (signals.averageRating / 5) * 100,
        disputeRate: (1 - signals.disputeRate) * 100,
        responseTime: Math.max(0, 100 - (signals.responseTime * 2)),
        onTimeDelivery: signals.onTimeDelivery * 100,
        repeatClients: Math.min(signals.repeatClients * 10, 100),
    };

    let score = 0;
    for (const [key, weight] of Object.entries(weights)) {
        score += normalized[key as keyof typeof normalized] * weight;
    }

    return Math.round(score);
};

// ─── Skill Matching ──────────────────────────────────────────────────────────

const LEVEL_SCORES: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

export const calculateSkillMatchByIds = (
    requiredSkillIds: string[],
    contributorSkills: ContributorSkill[],
    skillNameMap: Record<string, string> = {}
): SkillMatchResult => {
    if (requiredSkillIds.length === 0) {
        return {
            score: 80,
            breakdown: [],
            coverage: 100,
            matchedCount: 0,
            requiredMet: true,
        };
    }

    const breakdown: SkillMatch[] = [];
    let matchedCount = 0;

    for (const skillId of requiredSkillIds) {
        const match = contributorSkills.find(s => s.skillId === skillId);
        const skillName = skillNameMap[skillId] || skillId;

        if (match) {
            matchedCount++;
            const contLevel = LEVEL_SCORES[match.proficiencyLevel] || 2;

            let matchScore = 70 + (contLevel * 7.5); // 77.5 to 100
            if (match.verified) matchScore = Math.min(100, matchScore + 5);
            matchScore = Math.min(100, matchScore + Math.min(match.yearsExperience * 2, 10));

            breakdown.push({
                skillId,
                skillName,
                requiredLevel: 'intermediate', // Default since not specified in Mission type
                contributorLevel: match.proficiencyLevel,
                matchScore: Math.round(matchScore),
                isExact: true,
                isUpgrade: contLevel > 2,
                verified: match.verified || false,
            });
        } else {
            breakdown.push({
                skillId,
                skillName,
                requiredLevel: 'intermediate',
                contributorLevel: 'beginner',
                matchScore: 0,
                isExact: false,
                isUpgrade: false,
                verified: false,
            });
        }
    }

    const coverage = Math.round((matchedCount / requiredSkillIds.length) * 100);
    const avgScore = breakdown.length > 0
        ? breakdown.reduce((sum, b) => sum + b.matchScore, 0) / breakdown.length
        : 0;

    return {
        score: Math.round(avgScore),
        breakdown,
        coverage,
        matchedCount,
        requiredMet: coverage >= 50,
    };
};

// ─── Availability Scoring ────────────────────────────────────────────────────

export const calculateAvailabilityScore = (
    contributor: ContributorProfile,
    estimatedDurationDays?: number
): number => {
    let score = 0;

    if (!contributor.isLookingForWork) {
        return 25;
    }

    score += 40;

    // Available hours
    const contributorHours = contributor.availabilityHoursPerWeek || 20;
    const requiredHoursPerWeek = estimatedDurationDays
        ? Math.min(40, Math.ceil((estimatedDurationDays * 5) / 7)) // rough estimate
        : 20;

    if (contributorHours >= requiredHoursPerWeek) {
        score += 40;
    } else {
        score += Math.round((contributorHours / requiredHoursPerWeek) * 40);
    }

    // Timezone set = ready to work
    if (contributor.timezone) {
        score += 20;
    }

    return Math.min(100, score);
};

// ─── Budget Fit Scoring ──────────────────────────────────────────────────────

export const calculateBudgetFit = (
    budgetMin: number,
    budgetMax: number,
    contributorScore: number // use matchPower as proxy for rate expectation
): number => {
    // Higher matchPower contributors might expect higher pay
    // This is a simplified model
    const midBudget = (budgetMin + budgetMax) / 2;

    if (midBudget >= 5000) {
        // High budget projects - prefer experienced contributors
        return Math.min(100, 50 + contributorScore * 0.5);
    } else if (midBudget >= 1000) {
        // Medium budget - balanced
        return 75;
    } else {
        // Low budget - any contributor works
        return 70;
    }
};

// ─── Timezone Fit Scoring ────────────────────────────────────────────────────

export const calculateTimezoneFit = (
    missionTimezone?: string,
    contributorTimezone?: string
): number => {
    if (!missionTimezone || !contributorTimezone) {
        return 70;
    }

    const hoursDiff = getTimezoneHoursDiff(missionTimezone, contributorTimezone);

    if (hoursDiff <= 2) return 100;
    if (hoursDiff <= 4) return 85;
    if (hoursDiff <= 6) return 70;
    if (hoursDiff <= 9) return 50;
    return 30;
};

const getTimezoneHoursDiff = (tz1: string, tz2: string): number => {
    const offsets: Record<string, number> = {
        'PST': -8, 'PDT': -7, 'MST': -7, 'MDT': -6, 'CST': -6, 'CDT': -5, 'EST': -5, 'EDT': -4,
        'GMT': 0, 'UTC': 0, 'BST': 1, 'CET': 1, 'CEST': 2, 'EET': 2, 'EEST': 3,
        'IST': 5.5, 'SGT': 8, 'CST_CHINA': 8, 'JST': 9, 'KST': 9, 'AEST': 10, 'AEDT': 11, 'NZST': 12,
    };

    const normalize = (tz: string) => tz.toUpperCase().replace(/[^A-Z]/g, '');
    const o1 = offsets[normalize(tz1)] ?? 0;
    const o2 = offsets[normalize(tz2)] ?? 0;

    return Math.abs(o1 - o2);
};
