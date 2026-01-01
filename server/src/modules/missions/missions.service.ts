import { db } from '../../config/firebase.js';
import type { Mission, Milestone, MissionApplication, MissionAssignment } from '../../types/firestore.js';
import type { CreateMission, UpdateMission, CreateMilestone, CreateApplication } from '../../schemas/index.js';

const MISSIONS_COLLECTION = 'missions';
const USERS_COLLECTION = 'users';

/**
 * Generate URL-friendly slug from title
 */
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 100) + '-' + Date.now().toString(36);
};

/**
 * Create a new mission
 */
export const createMission = async (
    initiatorId: string,
    data: CreateMission
): Promise<Mission> => {
    const now = new Date();

    // Get initiator name
    const userDoc = await db.collection(USERS_COLLECTION).doc(initiatorId).get();
    const userName = userDoc.exists ? (userDoc.data()?.fullName || 'Unknown') : 'Unknown';

    const mission: Omit<Mission, 'id'> = {
        initiatorId,
        initiatorName: userName,
        title: data.title,
        slug: generateSlug(data.title),
        description: data.description,
        problemStatement: data.problemStatement,
        successCriteria: data.successCriteria,
        type: data.type,
        complexity: data.complexity || 'medium',
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        estimatedDurationDays: data.estimatedDurationDays,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        maxLeadContributors: 1,
        maxShadowContributors: 1,
        requiresCoreReviewer: true,
        status: 'draft',
        isPublic: data.isPublic ?? true,
        featured: false,
        requiredSkills: data.requiredSkills || [],
        createdAt: now,
        updatedAt: now,
    };

    const docRef = await db.collection(MISSIONS_COLLECTION).add(mission);

    return { id: docRef.id, ...mission };
};

/**
 * Get mission by ID
 */
export const getMissionById = async (missionId: string): Promise<Mission | null> => {
    const doc = await db.collection(MISSIONS_COLLECTION).doc(missionId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Mission;
};

/**
 * Get mission by slug
 */
export const getMissionBySlug = async (slug: string): Promise<Mission | null> => {
    const snapshot = await db
        .collection(MISSIONS_COLLECTION)
        .where('slug', '==', slug)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Mission;
};

/**
 * Get public missions with pagination
 */
export const getPublicMissions = async (
    options: {
        limit?: number;
        type?: string;
        complexity?: string;
        status?: string;
    } = {}
): Promise<Mission[]> => {
    let query: FirebaseFirestore.Query = db
        .collection(MISSIONS_COLLECTION)
        .where('isPublic', '==', true);

    // Apply filters
    if (options.type) {
        query = query.where('type', '==', options.type);
    }
    if (options.complexity) {
        query = query.where('complexity', '==', options.complexity);
    }
    if (options.status) {
        query = query.where('status', '==', options.status);
    } else {
        // Default to open missions
        query = query.where('status', 'in', ['open', 'matching']);
    }

    query = query.orderBy('createdAt', 'desc').limit(options.limit || 20);

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Mission));
};

/**
 * Get missions by initiator
 */
export const getMissionsByInitiator = async (initiatorId: string): Promise<Mission[]> => {
    const snapshot = await db
        .collection(MISSIONS_COLLECTION)
        .where('initiatorId', '==', initiatorId)
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Mission));
};

/**
 * Update mission
 */
export const updateMission = async (
    missionId: string,
    data: UpdateMission
): Promise<void> => {
    await db.collection(MISSIONS_COLLECTION).doc(missionId).update({
        ...data,
        updatedAt: new Date(),
    });
};

/**
 * Update mission status
 */
export const updateMissionStatus = async (
    missionId: string,
    status: Mission['status']
): Promise<void> => {
    const updateData: Partial<Mission> = {
        status,
        updatedAt: new Date(),
    };

    // Add timestamp based on status
    if (status === 'open') {
        updateData.publishedAt = new Date();
    } else if (status === 'in_progress') {
        updateData.startedAt = new Date();
    } else if (status === 'completed') {
        updateData.completedAt = new Date();
    }

    await db.collection(MISSIONS_COLLECTION).doc(missionId).update(updateData);
};

/**
 * Delete mission (soft delete by setting status to cancelled)
 */
export const deleteMission = async (missionId: string): Promise<void> => {
    await db.collection(MISSIONS_COLLECTION).doc(missionId).update({
        status: 'cancelled',
        updatedAt: new Date(),
    });
};

// ─── Milestones ───

/**
 * Add milestone to mission
 */
export const addMilestone = async (
    missionId: string,
    data: CreateMilestone
): Promise<Milestone> => {
    // Get current milestone count for order
    const milestonesRef = db.collection(MISSIONS_COLLECTION).doc(missionId).collection('milestones');
    const count = (await milestonesRef.count().get()).data().count;

    const milestone: Omit<Milestone, 'id'> = {
        missionId,
        title: data.title,
        description: data.description,
        orderIndex: count,
        amount: data.amount,
        status: 'pending',
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        createdAt: new Date(),
    };

    const docRef = await milestonesRef.add(milestone);
    return { id: docRef.id, ...milestone };
};

/**
 * Get milestones for mission
 */
export const getMilestones = async (missionId: string): Promise<Milestone[]> => {
    const snapshot = await db
        .collection(MISSIONS_COLLECTION)
        .doc(missionId)
        .collection('milestones')
        .orderBy('orderIndex')
        .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Milestone));
};

/**
 * Update milestone status
 */
export const updateMilestoneStatus = async (
    missionId: string,
    milestoneId: string,
    status: Milestone['status']
): Promise<void> => {
    const updateData: Partial<Milestone> = { status };

    if (status === 'submitted') {
        updateData.submittedAt = new Date();
    } else if (status === 'approved') {
        updateData.approvedAt = new Date();
    } else if (status === 'paid') {
        updateData.paidAt = new Date();
    }

    await db
        .collection(MISSIONS_COLLECTION)
        .doc(missionId)
        .collection('milestones')
        .doc(milestoneId)
        .update(updateData);
};

// ─── Applications ───

/**
 * Apply to mission
 */
export const applyToMission = async (
    missionId: string,
    contributorId: string,
    data: CreateApplication
): Promise<MissionApplication> => {
    // Get contributor name
    const userDoc = await db.collection(USERS_COLLECTION).doc(contributorId).get();
    const contributorName = userDoc.exists ? (userDoc.data()?.fullName || 'Unknown') : 'Unknown';

    const application: Omit<MissionApplication, 'id'> = {
        missionId,
        contributorId,
        contributorName,
        coverLetter: data.coverLetter,
        proposedTimeline: data.proposedTimeline,
        proposedApproach: data.proposedApproach,
        status: 'pending',
        createdAt: new Date(),
    };

    const docRef = await db
        .collection(MISSIONS_COLLECTION)
        .doc(missionId)
        .collection('applications')
        .add(application);

    return { id: docRef.id, ...application };
};

/**
 * Get applications for mission
 */
export const getApplications = async (missionId: string): Promise<MissionApplication[]> => {
    const snapshot = await db
        .collection(MISSIONS_COLLECTION)
        .doc(missionId)
        .collection('applications')
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MissionApplication));
};

/**
 * Update application status
 */
export const updateApplicationStatus = async (
    missionId: string,
    applicationId: string,
    status: MissionApplication['status']
): Promise<void> => {
    await db
        .collection(MISSIONS_COLLECTION)
        .doc(missionId)
        .collection('applications')
        .doc(applicationId)
        .update({
            status,
            reviewedAt: new Date(),
        });
};

// ─── Assignments ───

/**
 * Assign contributor to mission
 */
export const assignContributor = async (
    missionId: string,
    contributorId: string,
    role: MissionAssignment['role']
): Promise<MissionAssignment> => {
    // Get contributor name
    const userDoc = await db.collection(USERS_COLLECTION).doc(contributorId).get();
    const contributorName = userDoc.exists ? (userDoc.data()?.fullName || 'Unknown') : 'Unknown';

    const assignment: Omit<MissionAssignment, 'id'> = {
        missionId,
        contributorId,
        contributorName,
        role,
        status: 'active',
        assignedAt: new Date(),
        createdAt: new Date(),
    };

    const docRef = await db
        .collection(MISSIONS_COLLECTION)
        .doc(missionId)
        .collection('assignments')
        .add(assignment);

    return { id: docRef.id, ...assignment };
};

/**
 * Get assignments for mission
 */
export const getAssignments = async (missionId: string): Promise<MissionAssignment[]> => {
    const snapshot = await db
        .collection(MISSIONS_COLLECTION)
        .doc(missionId)
        .collection('assignments')
        .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MissionAssignment));
};
