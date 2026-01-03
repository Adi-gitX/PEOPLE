// Main Matching Service
// Orchestrates the matching engine

import { db } from '../../config/firebase.js';
import type { ContributorProfile, Mission, Skill } from '../../types/firestore.js';
import type {
    MatchResult,
    MatchBreakdown,
    RankingOptions,
    WorkHistory,
    MissionRecommendation,
} from './matching.types.js';
import {
    calculateMatchPower,
    calculateTrustScore,
    calculateSkillMatchByIds,
    calculateAvailabilityScore,
    calculateBudgetFit,
    calculateTimezoneFit,
    calculateEngagementSignals,
} from './scoring.js';

const CONTRIBUTOR_PROFILES_COLLECTION = 'contributorProfiles';
const MISSIONS_COLLECTION = 'missions';
const SKILLS_COLLECTION = 'skills';

// ─── Skill Name Cache ────────────────────────────────────────────────────────

let skillNameCache: Record<string, string> = {};
let skillCacheExpiry = 0;

const getSkillNameMap = async (): Promise<Record<string, string>> => {
    if (Date.now() < skillCacheExpiry && Object.keys(skillNameCache).length > 0) {
        return skillNameCache;
    }

    const snapshot = await db.collection(SKILLS_COLLECTION).get();
    const map: Record<string, string> = {};
    snapshot.docs.forEach(doc => {
        const skill = doc.data() as Skill;
        map[doc.id] = skill.name;
    });

    skillNameCache = map;
    skillCacheExpiry = Date.now() + 5 * 60 * 1000; // 5 min cache
    return map;
};

// ─── Work History ────────────────────────────────────────────────────────────

export const getWorkHistory = async (contributorId: string): Promise<WorkHistory> => {
    const profileDoc = await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(contributorId).get();
    const profile = profileDoc.data() as ContributorProfile | undefined;

    // Get completed missions from payments
    const completedSnapshot = await db.collection('payments')
        .where('contributorId', '==', contributorId)
        .where('type', '==', 'release')
        .where('status', '==', 'completed')
        .get();

    // Get disputes
    const disputeSnapshot = await db.collection('disputes')
        .where('contributorId', '==', contributorId)
        .get();

    // Get reviews
    const reviewSnapshot = await db.collection('reviews')
        .where('revieweeId', '==', contributorId)
        .get();

    const completedCount = completedSnapshot.size;
    const disputeCount = disputeSnapshot.size;
    const ratings = reviewSnapshot.docs.map(d => d.data().rating as number);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    // Count repeat clients
    const initiatorCounts: Record<string, number> = {};
    completedSnapshot.docs.forEach(doc => {
        const initiatorId = doc.data().initiatorId;
        if (initiatorId) {
            initiatorCounts[initiatorId] = (initiatorCounts[initiatorId] || 0) + 1;
        }
    });
    const repeatClients = Object.values(initiatorCounts).filter(c => c > 1).length;

    return {
        completedMissions: completedCount,
        completionRate: profile?.completionRate || (completedCount > 0 ? 0.9 : 0),
        averageRating: avgRating,
        disputeRate: completedCount > 0 ? disputeCount / (completedCount + disputeCount) : 0,
        avgResponseTime: 12,
        onTimeRate: 0.85,
        repeatClients,
        totalEarnings: profile?.totalEarnings || 0,
    };
};

// ─── Match Contributor to Mission ────────────────────────────────────────────

export const calculateMissionMatch = async (
    mission: Mission,
    contributor: ContributorProfile
): Promise<MatchResult> => {
    const history = await getWorkHistory(contributor.id || '');
    const skillNameMap = await getSkillNameMap();

    // 1. Skill Matching (using string[] skillIds)
    const skillResult = calculateSkillMatchByIds(
        mission.requiredSkills || [],
        contributor.skills || [],
        skillNameMap
    );

    // 2. Trust Score
    const trustScore = calculateTrustScore({
        completionRate: history.completionRate,
        averageRating: history.averageRating,
        disputeRate: history.disputeRate,
        responseTime: history.avgResponseTime,
        onTimeDelivery: history.onTimeRate,
        repeatClients: history.repeatClients,
    });

    // 3. Availability
    const availabilityScore = calculateAvailabilityScore(
        contributor,
        mission.estimatedDurationDays
    );

    // 4. Budget Fit
    const budgetFitScore = calculateBudgetFit(
        mission.budgetMin || 0,
        mission.budgetMax || mission.budgetMin || 1000,
        contributor.matchPower || 50
    );

    // 5. Timezone
    const timezoneFitScore = calculateTimezoneFit(
        undefined, // Mission doesn't have preferredTimezone in schema
        contributor.timezone
    );

    // 6. Engagement
    const engagementScore = calculateEngagementSignals(contributor);

    // Weighted aggregate
    const weights = {
        skill: 0.30,
        trust: 0.25,
        availability: 0.15,
        budget: 0.15,
        timezone: 0.10,
        engagement: 0.05,
    };

    const overallScore = Math.round(
        skillResult.score * weights.skill +
        trustScore * weights.trust +
        availabilityScore * weights.availability +
        budgetFitScore * weights.budget +
        timezoneFitScore * weights.timezone +
        engagementScore * weights.engagement
    );

    const breakdown: MatchBreakdown = {
        skills: skillResult,
        trust: trustScore,
        availability: availabilityScore,
        budgetFit: budgetFitScore,
        timezoneFit: timezoneFitScore,
        engagement: engagementScore,
    };

    return {
        contributorId: contributor.id || contributor.userId,
        contributorName: contributor.headline,
        contributorAvatar: undefined,
        missionId: mission.id || '',
        overallScore,
        skillScore: skillResult.score,
        trustScore,
        availabilityScore,
        budgetFitScore,
        timezoneFitScore,
        engagementScore,
        breakdown,
        rank: 0,
        matchedAt: new Date(),
    };
};

// ─── Match All Contributors to Mission ───────────────────────────────────────

export const matchContributorsToMission = async (
    missionId: string,
    options: RankingOptions = {}
): Promise<MatchResult[]> => {
    const missionDoc = await db.collection(MISSIONS_COLLECTION).doc(missionId).get();
    if (!missionDoc.exists) {
        throw new Error('Mission not found');
    }

    const mission = { id: missionDoc.id, ...missionDoc.data() } as Mission;

    // Get available contributors
    const contributorsSnapshot = await db.collection(CONTRIBUTOR_PROFILES_COLLECTION)
        .where('verificationStatus', '==', 'verified')
        .where('isLookingForWork', '==', true)
        .get();

    const contributors = contributorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as ContributorProfile));

    // Calculate matches
    const matchPromises = contributors.map(c => calculateMissionMatch(mission, c));
    let matches = await Promise.all(matchPromises);

    // Filter
    matches = matches.filter(m => {
        if (options.minimumScore && m.overallScore < options.minimumScore) return false;
        if (m.breakdown.skills.coverage < 30) return false;
        if (m.availabilityScore < 20) return false;
        if (options.strictBudget && m.budgetFitScore < 50) return false;
        return true;
    });

    // Diversity boost
    if (options.diversityBoost) {
        matches = matches.map(m => ({
            ...m,
            overallScore: m.overallScore + Math.floor(Math.random() * 3),
        }));
    }

    // Sort
    matches.sort((a, b) => b.overallScore - a.overallScore);

    // Assign ranks
    matches.forEach((m, i) => {
        m.rank = i + 1;
    });

    // Limit
    if (options.limit) {
        matches = matches.slice(0, options.limit);
    }

    // Store
    await storeMatchResults(missionId, matches.slice(0, 50));

    return matches;
};

const storeMatchResults = async (missionId: string, matches: MatchResult[]): Promise<void> => {
    const batch = db.batch();
    const matchRef = db.collection(MISSIONS_COLLECTION).doc(missionId).collection('matches');

    // Clear existing
    const existing = await matchRef.limit(100).get();
    existing.docs.forEach(doc => batch.delete(doc.ref));

    // Add new
    matches.forEach(match => {
        const docRef = matchRef.doc(match.contributorId);
        batch.set(docRef, {
            ...match,
            matchedAt: new Date(),
        });
    });

    await batch.commit();
};

// ─── Get Stored Matches ──────────────────────────────────────────────────────

export const getMatchesForMission = async (missionId: string): Promise<MatchResult[]> => {
    const matchRef = db.collection(MISSIONS_COLLECTION).doc(missionId).collection('matches');
    const snapshot = await matchRef.orderBy('overallScore', 'desc').limit(50).get();
    return snapshot.docs.map(doc => doc.data() as MatchResult);
};

// ─── Get Mission Recommendations for Contributor ─────────────────────────────

export const getMissionRecommendations = async (
    contributorId: string,
    limit: number = 10
): Promise<MissionRecommendation[]> => {
    const contributorDoc = await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(contributorId).get();
    if (!contributorDoc.exists) {
        return [];
    }

    const contributor = { id: contributorDoc.id, ...contributorDoc.data() } as ContributorProfile;

    // Get open missions
    const missionsSnapshot = await db.collection(MISSIONS_COLLECTION)
        .where('status', 'in', ['open', 'matching'])
        .limit(50)
        .get();

    const missions = missionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Mission));

    const recommendations: MissionRecommendation[] = [];

    for (const mission of missions) {
        const match = await calculateMissionMatch(mission, contributor);

        if (match.overallScore >= 40) {
            recommendations.push({
                missionId: mission.id || '',
                missionTitle: mission.title,
                missionBudget: {
                    min: mission.budgetMin || 0,
                    max: mission.budgetMax || mission.budgetMin || 1000,
                },
                matchScore: match.overallScore,
                skillMatch: match.skillScore,
                budgetMatch: match.budgetFitScore,
                reason: generateMatchReason(match),
            });
        }
    }

    recommendations.sort((a, b) => b.matchScore - a.matchScore);
    return recommendations.slice(0, limit);
};

const generateMatchReason = (match: MatchResult): string => {
    const reasons: string[] = [];
    if (match.skillScore >= 80) reasons.push('Great skill match');
    else if (match.skillScore >= 60) reasons.push('Good skill match');
    if (match.budgetFitScore >= 80) reasons.push('fits your profile');
    if (match.breakdown.skills.coverage === 100) reasons.push('all skills covered');
    return reasons.length > 0 ? reasons.join(', ') : 'Potential match';
};

// ─── Refresh Match Power ─────────────────────────────────────────────────────

export const refreshContributorMatchPower = async (contributorId: string): Promise<number> => {
    const contributorDoc = await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(contributorId).get();
    if (!contributorDoc.exists) {
        throw new Error('Contributor not found');
    }

    const contributor = contributorDoc.data() as ContributorProfile;
    const history = await getWorkHistory(contributorId);
    const { score } = calculateMatchPower(contributor, history);

    await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(contributorId).update({
        matchPower: score,
        updatedAt: new Date(),
    });

    return score;
};

// ─── Calculate Single Match (Preview) ────────────────────────────────────────

export const calculateMatchPreview = async (
    missionId: string,
    contributorId: string
): Promise<MatchResult> => {
    const missionDoc = await db.collection(MISSIONS_COLLECTION).doc(missionId).get();
    if (!missionDoc.exists) throw new Error('Mission not found');

    const contributorDoc = await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(contributorId).get();
    if (!contributorDoc.exists) throw new Error('Contributor not found');

    const mission = { id: missionDoc.id, ...missionDoc.data() } as Mission;
    const contributor = { id: contributorDoc.id, ...contributorDoc.data() } as ContributorProfile;

    return calculateMissionMatch(mission, contributor);
};
