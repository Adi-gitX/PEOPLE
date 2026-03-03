import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as matchingService from './matching.service.js';
import { db } from '../../config/firebase.js';
import type { Mission } from '../../types/firestore.js';
import {
    generateMatchExplanation,
    analyzeSkillGaps,
    calculateMatchConfidence,
} from './advanced.js';

const router = Router();
const MISSIONS_COLLECTION = 'missions';

const getMissionForAccessCheck = async (missionId: string): Promise<(Mission & { id: string }) | null> => {
    const missionDoc = await db.collection(MISSIONS_COLLECTION).doc(missionId).get();
    if (!missionDoc.exists) return null;
    return { id: missionDoc.id, ...missionDoc.data() } as Mission & { id: string };
};

const canAccessMissionMatching = (uid: string, userRole: string | undefined, mission: Mission): boolean => {
    if (userRole === 'admin') return true;
    return mission.initiatorId === uid;
};

router.post('/missions/:missionId/run', requireAuth, async (req, res) => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const mission = await getMissionForAccessCheck(req.params.missionId);
        if (!mission) {
            res.status(404).json({ error: 'Mission not found' });
            return;
        }
        if (!canAccessMissionMatching(uid, req.userRole, mission)) {
            res.status(403).json({ error: 'Not authorized to run matching for this mission' });
            return;
        }

        const options = {
            limit: req.body.limit || 20,
            minimumScore: req.body.minimumScore || 30,
            strictBudget: req.body.strictBudget || false,
            diversityBoost: req.body.diversityBoost ?? true,
        };
        const result = await matchingService.runMissionMatching(req.params.missionId, options);
        res.json({
            success: true,
            missionId: req.params.missionId,
            source: result.source,
            computedAt: result.computedAt,
            expiresAt: result.expiresAt,
            matches: result.matches,
            count: result.matches.length,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/missions/:missionId/results', requireAuth, async (req, res) => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const mission = await getMissionForAccessCheck(req.params.missionId);
        if (!mission) {
            res.status(404).json({ error: 'Mission not found' });
            return;
        }
        if (!canAccessMissionMatching(uid, req.userRole, mission)) {
            res.status(403).json({ error: 'Not authorized to access matching results for this mission' });
            return;
        }

        const result = await matchingService.getMissionMatchingResults(req.params.missionId);
        res.json({
            success: true,
            missionId: req.params.missionId,
            source: result.source,
            computedAt: result.computedAt,
            expiresAt: result.expiresAt,
            matches: result.matches,
            count: result.matches.length,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Get Matches for a Mission ───────────────────────────────────────────────
router.get('/mission/:missionId', requireAuth, async (req, res) => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const mission = await getMissionForAccessCheck(req.params.missionId);
        if (!mission) {
            res.status(404).json({ error: 'Mission not found' });
            return;
        }
        if (!canAccessMissionMatching(uid, req.userRole, mission)) {
            res.status(403).json({ error: 'Not authorized to access mission matches' });
            return;
        }

        const matches = await matchingService.getMatchesForMission(req.params.missionId);
        res.json({ matches, count: matches.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Trigger Matching for a Mission ──────────────────────────────────────────
router.post('/mission/:missionId/refresh', requireAuth, async (req, res) => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const mission = await getMissionForAccessCheck(req.params.missionId);
        if (!mission) {
            res.status(404).json({ error: 'Mission not found' });
            return;
        }
        if (!canAccessMissionMatching(uid, req.userRole, mission)) {
            res.status(403).json({ error: 'Not authorized to refresh mission matches' });
            return;
        }

        const options = {
            limit: req.body.limit || 20,
            minimumScore: req.body.minimumScore || 30,
            strictBudget: req.body.strictBudget || false,
            diversityBoost: req.body.diversityBoost ?? true,
        };

        const matches = await matchingService.matchContributorsToMission(
            req.params.missionId,
            options
        );

        // Enhance matches with explanations
        const enhancedMatches = matches.map(match => ({
            ...match,
            explanation: generateMatchExplanation(match),
        }));

        res.json({
            success: true,
            matches: enhancedMatches,
            count: enhancedMatches.length,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// ─── Get Mission Recommendations ─────────────────────────────────────────────
router.get('/recommendations', requireAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const recommendations = await matchingService.getMissionRecommendations(
            req.user!.uid,
            limit
        );

        res.json({
            recommendations,
            count: recommendations.length,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Get Recommendations for Specific Contributor ────────────────────────────
router.get('/contributor/:contributorId/recommendations', requireAuth, async (req, res) => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (req.userRole !== 'admin' && uid !== req.params.contributorId) {
            res.status(403).json({ error: 'Not authorized to access these recommendations' });
            return;
        }

        const limit = parseInt(req.query.limit as string) || 10;
        const recommendations = await matchingService.getMissionRecommendations(
            req.params.contributorId,
            limit
        );

        res.json({
            recommendations,
            count: recommendations.length,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Refresh Contributor Match Power ─────────────────────────────────────────
router.post('/refresh-power', requireAuth, async (req, res) => {
    try {
        const newScore = await matchingService.refreshContributorMatchPower(req.user!.uid);
        res.json({ matchPower: newScore });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// ─── Match Preview with Full Analysis ────────────────────────────────────────
router.post('/preview', requireAuth, async (req, res) => {
    try {
        const { missionId } = req.body;

        if (!missionId) {
            res.status(400).json({ error: 'missionId required' });
            return;
        }

        const match = await matchingService.calculateMatchPreview(missionId, req.user!.uid);
        const history = await matchingService.getWorkHistory(req.user!.uid);
        const confidence = calculateMatchConfidence(match, history);
        const explanation = generateMatchExplanation(match);

        res.json({
            matchScore: match.overallScore,
            confidence: confidence.confidence,
            confidenceExplanation: confidence.explanation,
            explanation,
            breakdown: {
                skills: match.skillScore,
                trust: match.trustScore,
                availability: match.availabilityScore,
                budget: match.budgetFitScore,
                timezone: match.timezoneFitScore,
                engagement: match.engagementScore,
            },
            skillDetails: match.breakdown.skills,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Analyze Skill Gaps ──────────────────────────────────────────────────────
router.post('/skill-gaps', requireAuth, async (req, res) => {
    try {
        const { missionId } = req.body;

        if (!missionId) {
            res.status(400).json({ error: 'missionId required' });
            return;
        }

        // Get mission
        const missionDoc = await db.collection('missions').doc(missionId).get();
        if (!missionDoc.exists) {
            res.status(404).json({ error: 'Mission not found' });
            return;
        }

        // Get contributor
        const contributorDoc = await db.collection('contributorProfiles').doc(req.user!.uid).get();
        if (!contributorDoc.exists) {
            res.status(404).json({ error: 'Contributor profile not found' });
            return;
        }

        // Get skill names
        const skillsSnapshot = await db.collection('skills').get();
        const skillNameMap: Record<string, string> = {};
        skillsSnapshot.docs.forEach(doc => {
            skillNameMap[doc.id] = doc.data().name;
        });

        const mission = missionDoc.data() as any;
        const contributor = contributorDoc.data() as any;

        const gaps = analyzeSkillGaps(
            mission.requiredSkills || [],
            contributor.skills || [],
            skillNameMap
        );

        res.json({
            gaps,
            totalRequired: (mission.requiredSkills || []).length,
            gapCount: gaps.length,
            criticalGaps: gaps.filter(g => g.severity === 'critical').length,
            recommendation: gaps.length === 0
                ? 'You have all required skills!'
                : `Consider improving: ${gaps.slice(0, 3).map(g => g.skillName).join(', ')}`,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Get Match Statistics ────────────────────────────────────────────────────
router.get('/stats', requireAuth, async (req, res) => {
    try {
        // Get contributor stats
        const contributorDoc = await db.collection('contributorProfiles').doc(req.user!.uid).get();
        if (!contributorDoc.exists) {
            res.status(404).json({ error: 'Contributor profile not found' });
            return;
        }

        const profile = contributorDoc.data() as any;
        const history = await matchingService.getWorkHistory(req.user!.uid);

        res.json({
            matchPower: profile.matchPower || 0,
            trustScore: profile.trustScore || 0,
            skillCount: (profile.skills || []).length,
            verifiedSkills: (profile.skills || []).filter((s: any) => s.verified).length,
            completedMissions: history.completedMissions,
            averageRating: history.averageRating,
            completionRate: history.completionRate,
            profileCompleteness: calculateProfileCompleteness(profile),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Helper function
const calculateProfileCompleteness = (profile: any): number => {
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

export default router;
