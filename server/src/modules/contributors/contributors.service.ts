import { db } from '../../config/firebase.js';
import type { ContributorProfile, ContributorSkill, Skill } from '../../types/firestore.js';
import type { UpdateContributorProfile } from '../../schemas/index.js';

const CONTRIBUTOR_PROFILES_COLLECTION = 'contributorProfiles';
const SKILLS_COLLECTION = 'skills';
const USERS_COLLECTION = 'users';
const INDEX_FALLBACK_FETCH_LIMIT = 100;

const stripUndefinedFields = <T extends Record<string, unknown>>(payload: T): Partial<T> => {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
};

const normalizeOptionalText = (value: string | null | undefined): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeOptionalUrl = (value: string | null | undefined): string | null | undefined => {
    if (value === null) return null;
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const isFirestoreIndexError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    const maybeCode = (error as { code?: number | string }).code;
    const message = error.message.toLowerCase();
    return (
        maybeCode === 9 ||
        maybeCode === 'failed-precondition' ||
        message.includes('requires an index') ||
        message.includes('failed precondition')
    );
};

/**
 * Get contributor profile by user ID
 */
export const getContributorProfile = async (userId: string): Promise<ContributorProfile | null> => {
    const doc = await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(userId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as ContributorProfile;
};

/**
 * Get all verified contributors (for matching/network)
 */
export const getVerifiedContributors = async (
    limit: number = 20,
    lastDoc?: FirebaseFirestore.DocumentSnapshot
): Promise<{ contributors: ContributorProfile[]; lastDoc: FirebaseFirestore.DocumentSnapshot | null }> => {
    try {
        let query = db
            .collection(CONTRIBUTOR_PROFILES_COLLECTION)
            .where('verificationStatus', '==', 'verified')
            .orderBy('trustScore', 'desc')
            .limit(limit);

        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();
        const contributors = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ContributorProfile));
        const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

        return { contributors, lastDoc: newLastDoc };
    } catch (error) {
        if (!isFirestoreIndexError(error)) {
            throw error;
        }

        const fallbackLimit = Math.max(limit, INDEX_FALLBACK_FETCH_LIMIT);
        const fallbackSnapshot = await db
            .collection(CONTRIBUTOR_PROFILES_COLLECTION)
            .where('verificationStatus', '==', 'verified')
            .limit(fallbackLimit)
            .get();

        const sortedContributors = fallbackSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as ContributorProfile))
            .sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0))
            .slice(0, limit);

        return { contributors: sortedContributors, lastDoc: null };
    }
};

export const getPublicContributors = async (
    limit: number = 20
): Promise<Array<{
    id: string;
    userId: string;
    fullName: string;
    avatarUrl?: string;
    headline?: string;
    bio?: string;
    skills: ContributorSkill[];
    trustScore: number;
    matchPower: number;
    yearsExperience: number;
    isLookingForWork?: boolean;
    verificationStatus?: ContributorProfile['verificationStatus'];
    backgroundCheckStatus?: ContributorProfile['backgroundCheckStatus'];
    totalMissionsCompleted?: number;
    totalEarnings?: number;
}>> => {
    let contributors: ContributorProfile[];
    try {
        ({ contributors } = await getVerifiedContributors(limit));
    } catch (error) {
        if (!isFirestoreIndexError(error)) {
            throw error;
        }
        return [];
    }

    const userEntries = await Promise.all(
        contributors.map(async (contributor) => {
            const userId = contributor.userId || contributor.id || '';
            const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

            return [
                userId,
                {
                    fullName: userDoc.exists ? userDoc.data()?.fullName || 'Unknown' : 'Unknown',
                    avatarUrl: userDoc.exists ? userDoc.data()?.avatarUrl : undefined,
                },
            ] as const;
        })
    );

    const userMap = Object.fromEntries(userEntries);

    return contributors.map((contributor) => {
        const userId = contributor.userId || contributor.id || '';
        const user = userMap[userId] || { fullName: 'Unknown' };
        return {
            id: contributor.id || userId,
            userId,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            headline: contributor.headline,
            bio: contributor.bio,
            skills: contributor.skills || [],
            trustScore: contributor.trustScore || 0,
            matchPower: contributor.matchPower || 0,
            yearsExperience: contributor.yearsExperience || 0,
            isLookingForWork: contributor.isLookingForWork,
            verificationStatus: contributor.verificationStatus,
            backgroundCheckStatus: contributor.backgroundCheckStatus,
            totalMissionsCompleted: contributor.totalMissionsCompleted || 0,
            totalEarnings: contributor.totalEarnings || 0,
        };
    });
};

/**
 * Get contributors looking for work (for matching)
 */
export const getAvailableContributors = async (): Promise<ContributorProfile[]> => {
    const snapshot = await db
        .collection(CONTRIBUTOR_PROFILES_COLLECTION)
        .where('verificationStatus', '==', 'verified')
        .where('isLookingForWork', '==', true)
        .orderBy('matchPower', 'desc')
        .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ContributorProfile));
};

/**
 * Update contributor profile
 */
export const updateContributorProfile = async (
    userId: string,
    data: UpdateContributorProfile
): Promise<void> => {
    const normalizedData = stripUndefinedFields({
        headline: normalizeOptionalText(data.headline),
        bio: normalizeOptionalText(data.bio),
        githubUrl: normalizeOptionalUrl(data.githubUrl),
        linkedinUrl: normalizeOptionalUrl(data.linkedinUrl),
        portfolioUrl: normalizeOptionalUrl(data.portfolioUrl),
        timezone: normalizeOptionalText(data.timezone),
        availabilityHoursPerWeek: data.availabilityHoursPerWeek,
    });

    const now = new Date();
    const profileRef = db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(userId);
    const snapshot = await profileRef.get();

    if (!snapshot.exists) {
        const fallbackProfile: FirebaseFirestore.DocumentData = {
            userId,
            verificationStatus: 'pending',
            isLookingForWork: false,
            availabilityHoursPerWeek: 20,
            yearsExperience: 0,
            trustScore: 0,
            matchPower: 0,
            completionRate: 0,
            totalMissionsCompleted: 0,
            totalEarnings: 0,
            shadowAssignments: 0,
            skills: [],
            backgroundCheckStatus: 'not_started',
            ...normalizedData,
            createdAt: now,
            updatedAt: now,
        };

        await profileRef.set(fallbackProfile, { merge: true });
        return;
    }

    await profileRef.set({
        ...normalizedData,
        updatedAt: now,
    }, { merge: true });
};

/**
 * Update availability status
 */
export const updateAvailability = async (
    userId: string,
    isLookingForWork: boolean
): Promise<void> => {
    const profileRef = db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(userId);
    const snapshot = await profileRef.get();
    const now = new Date();

    if (!snapshot.exists) {
        const fallbackProfile: ContributorProfile = {
            userId,
            verificationStatus: 'pending',
            isLookingForWork,
            availabilityHoursPerWeek: 20,
            yearsExperience: 0,
            trustScore: 0,
            matchPower: 0,
            completionRate: 0,
            totalMissionsCompleted: 0,
            totalEarnings: 0,
            shadowAssignments: 0,
            skills: [],
            backgroundCheckStatus: 'not_started',
            createdAt: now,
            updatedAt: now,
        };

        await profileRef.set(fallbackProfile, { merge: true });
        return;
    }

    await profileRef.update({
        isLookingForWork,
        updatedAt: now,
    });
};

/**
 * Add skill to contributor profile
 */
export const addSkill = async (
    userId: string,
    skillData: { skillId: string; proficiencyLevel: string; yearsExperience: number }
): Promise<ContributorSkill> => {
    // Get skill details
    const skillDoc = await db.collection(SKILLS_COLLECTION).doc(skillData.skillId).get();
    if (!skillDoc.exists) {
        throw new Error('Skill not found');
    }

    const skill = skillDoc.data() as Skill;

    const contributorSkill: ContributorSkill = {
        skillId: skillData.skillId,
        skillName: skill.name,
        proficiencyLevel: skillData.proficiencyLevel as ContributorSkill['proficiencyLevel'],
        yearsExperience: skillData.yearsExperience,
        verified: false,
    };

    // Get current profile
    const profileDoc = await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(userId).get();
    if (!profileDoc.exists) {
        throw new Error('Contributor profile not found');
    }

    const profile = profileDoc.data() as ContributorProfile;
    const currentSkills = profile.skills || [];

    // Check if skill already exists
    const existingIndex = currentSkills.findIndex((s) => s.skillId === skillData.skillId);
    if (existingIndex !== -1) {
        // Update existing skill
        currentSkills[existingIndex] = contributorSkill;
    } else {
        // Add new skill
        currentSkills.push(contributorSkill);
    }

    // Update profile with new skills and recalculate match power
    const newMatchPower = calculateMatchPower(profile, currentSkills);

    await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(userId).update({
        skills: currentSkills,
        matchPower: newMatchPower,
        updatedAt: new Date(),
    });

    return contributorSkill;
};

/**
 * Remove skill from contributor profile
 */
export const removeSkill = async (userId: string, skillId: string): Promise<void> => {
    const profileDoc = await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(userId).get();
    if (!profileDoc.exists) {
        throw new Error('Contributor profile not found');
    }

    const profile = profileDoc.data() as ContributorProfile;
    const updatedSkills = (profile.skills || []).filter((s) => s.skillId !== skillId);
    const newMatchPower = calculateMatchPower(profile, updatedSkills);

    await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(userId).update({
        skills: updatedSkills,
        matchPower: newMatchPower,
        updatedAt: new Date(),
    });
};

/**
 * Get all available skills
 */
export const getAllSkills = async (): Promise<Skill[]> => {
    const snapshot = await db
        .collection(SKILLS_COLLECTION)
        .where('isActive', '==', true)
        .get();

    const skills = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Skill));

    // Sort in memory to avoid composite index
    return skills.sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
    });
};

/**
 * Calculate match power based on profile completeness and skills
 */
const calculateMatchPower = (profile: ContributorProfile, skills: ContributorSkill[]): number => {
    let power = 0;

    // Profile completeness (0-30)
    if (profile.headline) power += 5;
    if (profile.bio) power += 10;
    if (profile.githubUrl) power += 5;
    if (profile.linkedinUrl) power += 5;
    if (profile.portfolioUrl) power += 5;

    // Skills (0-30)
    power += Math.min(skills.length * 5, 30);

    // Verification status (0-20)
    if (profile.verificationStatus === 'verified') power += 20;
    else if (profile.verificationStatus === 'proof_task_submitted') power += 10;

    // Experience (0-10)
    power += Math.min(profile.yearsExperience * 2, 10);

    // Background check (0-10)
    if (profile.backgroundCheckStatus === 'passed') power += 10;

    return Math.min(power, 100);
};

/**
 * Get all applications submitted by a contributor
 */
export const getMyApplications = async (contributorId: string): Promise<any[]> => {
    const MISSIONS_COLLECTION = 'missions';

    // Get all missions
    const missionsSnapshot = await db.collection(MISSIONS_COLLECTION).get();

    const applications: any[] = [];

    // For each mission, check if this contributor has applied
    for (const missionDoc of missionsSnapshot.docs) {
        const appSnapshot = await db
            .collection(MISSIONS_COLLECTION)
            .doc(missionDoc.id)
            .collection('applications')
            .where('contributorId', '==', contributorId)
            .get();

        if (!appSnapshot.empty) {
            const missionData = missionDoc.data();
            for (const appDoc of appSnapshot.docs) {
                applications.push({
                    id: appDoc.id,
                    ...appDoc.data(),
                    missionId: missionDoc.id,
                    missionTitle: missionData.title,
                    missionStatus: missionData.status,
                });
            }
        }
    }

    // Sort by creation date descending
    return applications.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
    });
};

/**
 * Submit entrance verification
 */
export const submitVerification = async (
    userId: string,
    analysis: string
): Promise<void> => {
    await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(userId).update({
        verificationStatus: 'pending',
        verificationAnalysis: analysis,
        verificationSubmittedAt: new Date(),
        updatedAt: new Date(),
    });
};
