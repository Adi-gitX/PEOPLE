# PEOPLE Platform - Matching Algorithm Complete Specification

## Executive Summary

This document provides an expert-level specification for the PEOPLE platform's **intelligent matching engine** - a sophisticated system that connects Contributors (freelancers) with Missions (projects) using multi-dimensional scoring, machine learning-ready signals, and real-time optimization.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MATCHING ENGINE CORE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │   PROFILE    │   │    SKILL     │   │  BEHAVIORAL  │   │   MISSION    │ │
│  │   ANALYZER   │───│   MATCHER    │───│   SIGNALS    │───│   RANKER     │ │
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘ │
│         │                  │                  │                  │          │
│         ▼                  ▼                  ▼                  ▼          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      COMPOSITE SCORE CALCULATOR                       │  │
│  │         matchScore = Σ(weightᵢ × signalᵢ) / Σ(weightᵢ)               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         RANKING & FILTERING                           │  │
│  │              Apply business rules, diversity, fraud detection          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│                          MATCHED CANDIDATES                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Match Power (Contributor Readiness Score)

### Current Implementation

The **matchPower** score (0-100) measures how "ready" a contributor is to be matched with missions:

```typescript
// Current implementation in contributors.service.ts
const calculateMatchPower = (profile: ContributorProfile, skills: ContributorSkill[]): number => {
    let power = 0;

    // Profile completeness (0-30 points)
    if (profile.headline) power += 5;
    if (profile.bio) power += 10;
    if (profile.githubUrl) power += 5;
    if (profile.linkedinUrl) power += 5;
    if (profile.portfolioUrl) power += 5;

    // Skills (0-30 points)
    power += Math.min(skills.length * 5, 30);

    // Verification (0-20 points)
    if (profile.verificationStatus === 'verified') power += 20;
    else if (profile.verificationStatus === 'proof_task_submitted') power += 10;

    // Experience (0-10 points)
    power += Math.min(profile.yearsExperience * 2, 10);

    // Background check (0-10 points)
    if (profile.backgroundCheckStatus === 'passed') power += 10;

    return Math.min(power, 100);
};
```

### Enhanced Match Power Algorithm

```typescript
interface MatchPowerFactors {
    profileCompleteness: number;  // 0-20
    skillDepth: number;           // 0-25
    verificationLevel: number;    // 0-20
    historicalPerformance: number; // 0-25
    engagementSignals: number;    // 0-10
}

const calculateEnhancedMatchPower = (
    profile: ContributorProfile,
    skills: ContributorSkill[],
    history: WorkHistory
): number => {
    const factors: MatchPowerFactors = {
        profileCompleteness: calculateProfileCompleteness(profile),
        skillDepth: calculateSkillDepth(skills),
        verificationLevel: calculateVerificationLevel(profile),
        historicalPerformance: calculateHistoricalPerformance(history),
        engagementSignals: calculateEngagementSignals(profile),
    };

    // Weighted sum with configurable weights
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

    return Math.round(score);
};
```

---

## Part 2: Skill Matching Engine

### Skill Compatibility Matrix

```typescript
interface SkillMatch {
    skillId: string;
    requiredLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    contributorLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    matchScore: number; // 0-100
    isExact: boolean;
    isUpgrade: boolean;
}

const LEVEL_SCORES = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4,
};

const calculateSkillMatch = (
    required: MissionSkill,
    contributor: ContributorSkill
): SkillMatch => {
    const reqLevel = LEVEL_SCORES[required.requiredLevel];
    const contLevel = LEVEL_SCORES[contributor.proficiencyLevel];

    let matchScore: number;
    let isExact = false;
    let isUpgrade = false;

    if (contLevel >= reqLevel) {
        // Meets or exceeds requirement
        if (contLevel === reqLevel) {
            matchScore = 100;
            isExact = true;
        } else {
            // Overqualified (slight penalty to prefer exact matches)
            matchScore = 100 - ((contLevel - reqLevel) * 5);
            isUpgrade = true;
        }
    } else {
        // Under-qualified (significant penalty)
        matchScore = Math.max(0, 100 - ((reqLevel - contLevel) * 30));
    }

    // Bonus for verified skills
    if (contributor.verified) {
        matchScore = Math.min(100, matchScore + 10);
    }

    // Bonus for years of experience
    const expBonus = Math.min(contributor.yearsExperience * 2, 10);
    matchScore = Math.min(100, matchScore + expBonus);

    return {
        skillId: required.skillId,
        requiredLevel: required.requiredLevel,
        contributorLevel: contributor.proficiencyLevel,
        matchScore,
        isExact,
        isUpgrade,
    };
};
```

### Multi-Skill Aggregation

```typescript
const calculateAggregateSkillScore = (
    missionSkills: MissionSkill[],
    contributorSkills: ContributorSkill[]
): { score: number; breakdown: SkillMatch[]; coverage: number } => {
    const breakdown: SkillMatch[] = [];
    let totalScore = 0;
    let matchedCount = 0;

    for (const required of missionSkills) {
        const match = contributorSkills.find(s => s.skillId === required.skillId);

        if (match) {
            const skillMatch = calculateSkillMatch(required, match);
            breakdown.push(skillMatch);
            totalScore += skillMatch.matchScore * (required.isRequired ? 1.5 : 1);
            matchedCount++;
        } else if (required.isRequired) {
            // Missing required skill = heavy penalty
            breakdown.push({
                skillId: required.skillId,
                requiredLevel: required.requiredLevel,
                contributorLevel: 'beginner',
                matchScore: 0,
                isExact: false,
                isUpgrade: false,
            });
        }
    }

    const requiredSkills = missionSkills.filter(s => s.isRequired);
    const requiredCoverage = requiredSkills.length > 0
        ? breakdown.filter(b => requiredSkills.some(r => r.skillId === b.skillId) && b.matchScore > 50).length / requiredSkills.length
        : 1;

    // If missing required skills, cap the score
    const maxPossible = requiredCoverage < 1 ? 50 : 100;
    const normalizedScore = matchedCount > 0
        ? Math.min(totalScore / matchedCount, maxPossible)
        : 0;

    return {
        score: Math.round(normalizedScore),
        breakdown,
        coverage: Math.round(requiredCoverage * 100),
    };
};
```

---

## Part 3: Behavioral & Historical Signals

### Trust Score Calculation

```typescript
interface TrustSignals {
    completionRate: number;      // % of missions completed successfully
    averageRating: number;       // 0-5 stars
    disputeRate: number;         // % of missions with disputes
    responseTime: number;        // Average hours to respond
    onTimeDelivery: number;      // % delivered on/before deadline
    repeatClients: number;       // # of initiators who hired again
}

const calculateTrustScore = (signals: TrustSignals): number => {
    const weights = {
        completionRate: 0.25,
        averageRating: 0.25,
        disputeRate: 0.15,      // Negative signal
        responseTime: 0.10,     // Lower is better
        onTimeDelivery: 0.15,
        repeatClients: 0.10,
    };

    // Normalize each signal to 0-100
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
```

### Activity & Engagement Scoring

```typescript
const calculateEngagementScore = (activity: UserActivity): number => {
    const now = Date.now();
    const daysSinceLogin = (now - activity.lastLoginAt) / (1000 * 60 * 60 * 24);
    const daysSinceActivity = (now - activity.lastActivityAt) / (1000 * 60 * 60 * 24);

    let score = 100;

    // Decay based on inactivity
    if (daysSinceLogin > 7) score -= 10;
    if (daysSinceLogin > 14) score -= 15;
    if (daysSinceLogin > 30) score -= 25;

    // Bonus for consistent activity
    if (activity.weeklyActiveStreak >= 4) score += 10;
    if (activity.proposalsThisMonth >= 5) score += 10;

    // Penalty for abandoned applications
    const abandonRate = activity.withdrawnProposals / Math.max(activity.totalProposals, 1);
    if (abandonRate > 0.3) score -= 15;

    return Math.max(0, Math.min(100, score));
};
```

---

## Part 4: Mission-Contributor Match Score

### Complete Matching Algorithm

```typescript
interface MatchResult {
    contributorId: string;
    missionId: string;
    overallScore: number;       // 0-100
    skillScore: number;         // 0-100
    trustScore: number;         // 0-100
    availabilityScore: number;  // 0-100
    budgetFitScore: number;     // 0-100
    timezoneFitScore: number;   // 0-100
    breakdown: MatchBreakdown;
    rank: number;
}

const calculateMissionMatch = async (
    mission: Mission,
    contributor: ContributorProfile,
    contributorHistory: WorkHistory
): Promise<MatchResult> => {
    // 1. Skill Matching (35% weight)
    const skillResult = calculateAggregateSkillScore(
        mission.requiredSkills,
        contributor.skills
    );

    // 2. Trust & Performance (25% weight)
    const trustScore = calculateTrustScore({
        completionRate: contributorHistory.completionRate,
        averageRating: contributorHistory.averageRating,
        disputeRate: contributorHistory.disputeRate,
        responseTime: contributorHistory.avgResponseTime,
        onTimeDelivery: contributorHistory.onTimeRate,
        repeatClients: contributorHistory.repeatClients,
    });

    // 3. Availability (15% weight)
    const availabilityScore = calculateAvailabilityScore(
        contributor,
        mission.estimatedDuration,
        mission.startDate
    );

    // 4. Budget Fit (15% weight)
    const budgetFitScore = calculateBudgetFit(
        mission.budgetMin,
        mission.budgetMax,
        contributor.hourlyRate,
        mission.estimatedHours
    );

    // 5. Timezone/Location (10% weight)
    const timezoneFitScore = calculateTimezoneFit(
        mission.preferredTimezone,
        contributor.timezone,
        mission.requiresOverlap
    );

    // Weighted aggregate
    const weights = {
        skill: 0.35,
        trust: 0.25,
        availability: 0.15,
        budget: 0.15,
        timezone: 0.10,
    };

    const overallScore = Math.round(
        skillResult.score * weights.skill +
        trustScore * weights.trust +
        availabilityScore * weights.availability +
        budgetFitScore * weights.budget +
        timezoneFitScore * weights.timezone
    );

    return {
        contributorId: contributor.id,
        missionId: mission.id,
        overallScore,
        skillScore: skillResult.score,
        trustScore,
        availabilityScore,
        budgetFitScore,
        timezoneFitScore,
        breakdown: {
            skills: skillResult.breakdown,
            factors: { skillResult, trustScore, availabilityScore, budgetFitScore, timezoneFitScore },
        },
        rank: 0, // Set after sorting
    };
};
```

### Availability Scoring

```typescript
const calculateAvailabilityScore = (
    contributor: ContributorProfile,
    estimatedDuration: string,
    startDate?: Date
): number => {
    let score = 0;

    // Base availability
    if (contributor.isLookingForWork) {
        score += 50;
    } else {
        return 20; // Not actively looking
    }

    // Availability hours
    const requiredHours = parseEstimatedHours(estimatedDuration);
    if (contributor.availableHoursPerWeek >= requiredHours) {
        score += 30;
    } else {
        score += (contributor.availableHoursPerWeek / requiredHours) * 30;
    }

    // Start date compatibility
    if (startDate) {
        const canStartBy = contributor.availableFrom || new Date();
        if (canStartBy <= startDate) {
            score += 20;
        } else {
            const daysLate = (canStartBy.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            score += Math.max(0, 20 - daysLate);
        }
    } else {
        score += 10; // Flexible start date
    }

    return Math.min(100, score);
};
```

### Budget Fit Scoring

```typescript
const calculateBudgetFit = (
    budgetMin: number,
    budgetMax: number,
    hourlyRate: number,
    estimatedHours?: number
): number => {
    if (!hourlyRate) return 50; // No rate set

    const midBudget = (budgetMin + budgetMax) / 2;
    const estimatedCost = hourlyRate * (estimatedHours || 40);

    // Perfect fit: estimated cost is within budget
    if (estimatedCost >= budgetMin && estimatedCost <= budgetMax) {
        // Closer to mid-budget = higher score
        const deviation = Math.abs(estimatedCost - midBudget) / midBudget;
        return Math.round(100 - (deviation * 20));
    }

    // Under budget (good for initiator)
    if (estimatedCost < budgetMin) {
        const savings = (budgetMin - estimatedCost) / budgetMin;
        return Math.round(100 - (savings * 10)); // Slight penalty for being too cheap
    }

    // Over budget (not ideal)
    const overagePercent = (estimatedCost - budgetMax) / budgetMax;
    return Math.round(Math.max(0, 80 - (overagePercent * 100)));
};
```

---

## Part 5: Ranking & Filtering Pipeline

### Ranking Pipeline

```typescript
const rankAndFilterMatches = async (
    mission: Mission,
    allMatches: MatchResult[],
    options: RankingOptions = {}
): Promise<MatchResult[]> => {
    let matches = [...allMatches];

    // 1. Filter out ineligible contributors
    matches = matches.filter(m => {
        // Must meet minimum skill coverage
        if (m.breakdown.skills.coverage < 50) return false;

        // Must have reasonable availability
        if (m.availabilityScore < 20) return false;

        // Must be within budget tolerance
        if (options.strictBudget && m.budgetFitScore < 60) return false;

        return true;
    });

    // 2. Apply diversity boost (prevent same contributors always winning)
    if (options.diversityBoost) {
        matches = applyDiversityBoost(matches, mission.initiatorId);
    }

    // 3. Apply recency boost (favor recently active contributors)
    if (options.recencyBoost) {
        matches = applyRecencyBoost(matches);
    }

    // 4. Sort by overall score
    matches.sort((a, b) => b.overallScore - a.overallScore);

    // 5. Assign ranks
    matches.forEach((m, i) => {
        m.rank = i + 1;
    });

    // 6. Return top N or all if no limit
    return options.limit ? matches.slice(0, options.limit) : matches;
};

const applyDiversityBoost = (
    matches: MatchResult[],
    initiatorId: string
): MatchResult[] => {
    // Boost contributors who haven't worked with this initiator recently
    // Prevents "rich get richer" effect
    return matches.map(m => {
        const previousJobs = getJobsWithInitiator(m.contributorId, initiatorId);
        if (previousJobs === 0) {
            return { ...m, overallScore: Math.min(100, m.overallScore + 5) };
        }
        return m;
    });
};
```

---

## Part 6: Real-Time Matching Pipeline

### Event-Driven Matching

```typescript
// Trigger matching when:
// 1. Mission is published
// 2. Contributor updates profile
// 3. Contributor enables "looking for work"

const MATCHING_EVENTS = {
    MISSION_PUBLISHED: 'mission.published',
    PROFILE_UPDATED: 'profile.updated',
    AVAILABILITY_CHANGED: 'availability.changed',
};

const handleMatchingEvent = async (event: MatchingEvent): Promise<void> => {
    switch (event.type) {
        case MATCHING_EVENTS.MISSION_PUBLISHED:
            await matchContributorsToMission(event.missionId);
            break;

        case MATCHING_EVENTS.PROFILE_UPDATED:
        case MATCHING_EVENTS.AVAILABILITY_CHANGED:
            await matchMissionsToContributor(event.contributorId);
            break;
    }
};

const matchContributorsToMission = async (missionId: string): Promise<void> => {
    const mission = await getMissionById(missionId);
    if (!mission || mission.status !== 'open') return;

    const availableContributors = await getAvailableContributors();

    const matches = await Promise.all(
        availableContributors.map(c =>
            calculateMissionMatch(mission, c, await getWorkHistory(c.id))
        )
    );

    const rankedMatches = await rankAndFilterMatches(mission, matches, {
        limit: 20,
        diversityBoost: true,
        recencyBoost: true,
    });

    // Store matches for initiator to view
    await storeMatchResults(missionId, rankedMatches);

    // Notify top matches
    const topMatches = rankedMatches.slice(0, 5);
    for (const match of topMatches) {
        await sendMatchNotification(match.contributorId, mission);
    }
};
```

---

## Part 7: Machine Learning Ready Signals

### Feature Vector for ML Model

```typescript
interface MatchFeatureVector {
    // Contributor features
    f_matchPower: number;
    f_trustScore: number;
    f_yearsExperience: number;
    f_completedMissions: number;
    f_avgRating: number;
    f_responseTime: number;
    f_skillCount: number;
    f_verifiedSkillCount: number;

    // Mission features
    f_budgetLevel: 'low' | 'medium' | 'high';
    f_complexity: 'simple' | 'moderate' | 'complex';
    f_requiredSkillCount: number;
    f_estimatedDuration: number;

    // Interaction features
    f_skillMatchScore: number;
    f_budgetFit: number;
    f_timezoneFit: number;
    f_previousInteractions: number;

    // Target variable (for training)
    y_wasHired?: boolean;
    y_wasSuccessful?: boolean;
    y_rating?: number;
}

const buildFeatureVector = (
    contributor: ContributorProfile,
    mission: Mission,
    matchResult: MatchResult
): MatchFeatureVector => {
    return {
        f_matchPower: contributor.matchPower,
        f_trustScore: contributor.trustScore,
        f_yearsExperience: contributor.yearsExperience,
        f_completedMissions: contributor.completedMissions || 0,
        f_avgRating: contributor.averageRating || 0,
        f_responseTime: contributor.avgResponseTime || 24,
        f_skillCount: contributor.skills.length,
        f_verifiedSkillCount: contributor.skills.filter(s => s.verified).length,

        f_budgetLevel: categorizeBudget(mission.budgetMax),
        f_complexity: mission.complexity,
        f_requiredSkillCount: mission.requiredSkills.length,
        f_estimatedDuration: parseHours(mission.estimatedDuration),

        f_skillMatchScore: matchResult.skillScore,
        f_budgetFit: matchResult.budgetFitScore,
        f_timezoneFit: matchResult.timezoneFitScore,
        f_previousInteractions: 0, // Query from history
    };
};
```

---

## Part 8: API Endpoints

### Matching Endpoints

```typescript
// GET /api/v1/matching/mission/:missionId
// Returns ranked contributors for a mission
router.get('/mission/:missionId', requireAuth, async (req, res) => {
    const matches = await getMatchesForMission(req.params.missionId);
    res.json({ matches });
});

// GET /api/v1/matching/contributor/:contributorId
// Returns recommended missions for a contributor
router.get('/contributor/:contributorId', requireAuth, async (req, res) => {
    const recommendations = await getMissionRecommendations(req.params.contributorId);
    res.json({ recommendations });
});

// POST /api/v1/matching/refresh
// Manually trigger re-matching
router.post('/refresh', requireAuth, async (req, res) => {
    const { missionId, contributorId } = req.body;
    if (missionId) {
        await matchContributorsToMission(missionId);
    } else if (contributorId) {
        await matchMissionsToContributor(contributorId);
    }
    res.json({ success: true });
});
```

---

## Part 9: Performance Optimization

### Caching Strategy

```typescript
const MATCH_CACHE_TTL = 300; // 5 minutes

const getCachedMatches = async (missionId: string): Promise<MatchResult[] | null> => {
    const cached = await redis.get(`matches:${missionId}`);
    return cached ? JSON.parse(cached) : null;
};

const setCachedMatches = async (missionId: string, matches: MatchResult[]): Promise<void> => {
    await redis.setex(`matches:${missionId}`, MATCH_CACHE_TTL, JSON.stringify(matches));
};

const invalidateMatchCache = async (contributorId: string): Promise<void> => {
    // Find all missions this contributor might match with
    const pattern = `matches:*`;
    const keys = await redis.keys(pattern);
    // Invalidate all (or use smarter invalidation)
    for (const key of keys) {
        await redis.del(key);
    }
};
```

### Batch Processing

```typescript
const processMatchingBatch = async (missionIds: string[]): Promise<void> => {
    const batchSize = 10;

    for (let i = 0; i < missionIds.length; i += batchSize) {
        const batch = missionIds.slice(i, i + batchSize);
        await Promise.all(batch.map(id => matchContributorsToMission(id)));

        // Rate limit between batches
        await sleep(100);
    }
};
```

---

## Part 10: Monitoring & Analytics

### Matching Quality Metrics

```typescript
interface MatchingMetrics {
    averageMatchScore: number;
    matchToHireRate: number;      // % of matches that result in hire
    matchToSuccessRate: number;   // % of matches that complete successfully
    avgTimeToHire: number;        // Hours from match to hire
    diversityScore: number;       // How diverse are the hired contributors
}

const calculateMatchingMetrics = async (period: DateRange): Promise<MatchingMetrics> => {
    const matches = await getMatchesInPeriod(period);
    const hires = await getHiresFromMatches(matches);
    const completions = await getCompletedFromHires(hires);

    return {
        averageMatchScore: average(matches.map(m => m.overallScore)),
        matchToHireRate: hires.length / matches.length,
        matchToSuccessRate: completions.length / hires.length,
        avgTimeToHire: average(hires.map(h => h.timeToHire)),
        diversityScore: calculateDiversity(hires),
    };
};
```

---

## Implementation Checklist

### Phase 1: Core Matching (Week 1)
- [x] Basic matchPower calculation
- [ ] Enhanced matchPower with all signals
- [ ] Skill matching engine
- [ ] Trust score calculation
- [ ] Budget fit scoring

### Phase 2: Advanced Features (Week 2)
- [ ] Availability scoring
- [ ] Timezone matching
- [ ] Real-time matching events
- [ ] Match caching

### Phase 3: ML Integration (Week 3)
- [ ] Feature vector generation
- [ ] Training data collection
- [ ] Model training pipeline
- [ ] A/B testing framework

### Phase 4: Optimization (Week 4)
- [ ] Performance tuning
- [ ] Monitoring dashboard
- [ ] Quality metrics
- [ ] Diversity algorithms

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `server/src/modules/matching/matching.service.ts` | Core matching logic |
| `server/src/modules/matching/matching.routes.ts` | API endpoints |
| `server/src/modules/matching/scoring.ts` | Score calculations |
| `server/src/modules/matching/signals.ts` | Behavioral signals |
| `server/src/modules/matching/cache.ts` | Caching layer |

---

## Summary

This matching algorithm provides:

1. **Multi-dimensional scoring** - Skills, trust, availability, budget, timezone
2. **Weighted aggregation** - Configurable weights for different factors
3. **Real-time updates** - Event-driven matching on profile/mission changes
4. **ML-ready architecture** - Feature vectors for future model training
5. **Performance optimization** - Caching, batching, efficient queries
6. **Quality monitoring** - Metrics to track matching effectiveness

The system is designed to evolve from rule-based matching to ML-powered recommendations as data accumulates.
