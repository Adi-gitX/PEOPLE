import { db } from '../../config/firebase.js';
import type { User, ContributorProfile, InitiatorProfile } from '../../types/firestore.js';
import type { CreateUser } from '../../schemas/index.js';

const USERS_COLLECTION = 'users';
const CONTRIBUTOR_PROFILES_COLLECTION = 'contributorProfiles';
const INITIATOR_PROFILES_COLLECTION = 'initiatorProfiles';

/**
 * Create a new user and their role-specific profile
 */
export const createUser = async (
    uid: string,
    data: CreateUser
): Promise<{ user: User; profile: ContributorProfile | InitiatorProfile }> => {
    const now = new Date();

    // Create base user document
    const user: User = {
        email: data.email,
        emailVerified: false,
        fullName: data.fullName,
        primaryRole: data.role,
        accountStatus: 'active',
        createdAt: now,
        updatedAt: now,
    };

    await db.collection(USERS_COLLECTION).doc(uid).set(user);

    // Create role-specific profile
    let profile: ContributorProfile | InitiatorProfile;

    if (data.role === 'contributor') {
        const contributorProfile: ContributorProfile = {
            userId: uid,
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
            createdAt: now,
            updatedAt: now,
        };

        await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(uid).set(contributorProfile);
        profile = contributorProfile;
    } else {
        const initiatorProfile: InitiatorProfile = {
            userId: uid,
            isVerified: false,
            totalMissionsPosted: 0,
            totalSpent: 0,
            averageRating: 0,
            createdAt: now,
            updatedAt: now,
        };

        await db.collection(INITIATOR_PROFILES_COLLECTION).doc(uid).set(initiatorProfile);
        profile = initiatorProfile;
    }

    return { user, profile };
};

/**
 * Get user by ID
 */
export const getUserById = async (uid: string): Promise<User | null> => {
    const doc = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as User;
};

/**
 * Get user with their profile
 */
export const getUserWithProfile = async (uid: string): Promise<{
    user: User | null;
    profile: ContributorProfile | InitiatorProfile | null;
}> => {
    const user = await getUserById(uid);
    if (!user) return { user: null, profile: null };

    let profile: ContributorProfile | InitiatorProfile | null = null;

    if (user.primaryRole === 'contributor') {
        const profileDoc = await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(uid).get();
        if (profileDoc.exists) {
            profile = { id: profileDoc.id, ...profileDoc.data() } as ContributorProfile;
        }
    } else if (user.primaryRole === 'initiator') {
        const profileDoc = await db.collection(INITIATOR_PROFILES_COLLECTION).doc(uid).get();
        if (profileDoc.exists) {
            profile = { id: profileDoc.id, ...profileDoc.data() } as InitiatorProfile;
        }
    }

    return { user, profile };
};

/**
 * Update user
 */
export const updateUser = async (
    uid: string,
    data: Partial<User>
): Promise<void> => {
    await db.collection(USERS_COLLECTION).doc(uid).update({
        ...data,
        updatedAt: new Date(),
    });
};

/**
 * Check if user exists
 */
export const userExists = async (uid: string): Promise<boolean> => {
    const doc = await db.collection(USERS_COLLECTION).doc(uid).get();
    return doc.exists;
};

/**
 * Check if email is already registered
 */
export const emailExists = async (email: string): Promise<boolean> => {
    const snapshot = await db
        .collection(USERS_COLLECTION)
        .where('email', '==', email)
        .limit(1)
        .get();
    return !snapshot.empty;
};
