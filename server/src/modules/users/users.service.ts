import { db } from '../../config/firebase.js';
import type { User, ContributorProfile, InitiatorProfile } from '../../types/firestore.js';
import type { CreateUser } from '../../schemas/index.js';
import { resolveAdminAccess } from '../../middleware/admin.js';

const USERS_COLLECTION = 'users';
const CONTRIBUTOR_PROFILES_COLLECTION = 'contributorProfiles';
const INITIATOR_PROFILES_COLLECTION = 'initiatorProfiles';
const ROLE_ROUTES = {
    contributor: '/dashboard/contributor',
    initiator: '/dashboard/initiator',
    admin: '/admin',
} as const;

type NonAdminRole = 'contributor' | 'initiator';
type SystemRole = NonAdminRole | 'admin';

export interface UserProfilesBundle {
    contributor: ContributorProfile | null;
    initiator: InitiatorProfile | null;
}

export interface UserRoleContext {
    user: User;
    profile: ContributorProfile | InitiatorProfile | null;
    profiles: UserProfilesBundle;
    availableRoles: SystemRole[];
    activeRole: SystemRole;
}

const stripUndefinedFields = <T extends Record<string, unknown>>(payload: T): Partial<T> => {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
};

const buildContributorProfile = (uid: string, now: Date): ContributorProfile => ({
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
});

const buildInitiatorProfile = (uid: string, now: Date): InitiatorProfile => ({
    userId: uid,
    isVerified: false,
    totalMissionsPosted: 0,
    totalSpent: 0,
    averageRating: 0,
    createdAt: now,
    updatedAt: now,
});

const ensureDualProfilesForNonAdmin = async (
    uid: string,
    user: User,
    profiles: UserProfilesBundle
): Promise<UserProfilesBundle> => {
    if (user.primaryRole === 'admin') {
        return profiles;
    }

    const now = new Date();
    const writes: Array<Promise<FirebaseFirestore.WriteResult>> = [];
    let contributor = profiles.contributor;
    let initiator = profiles.initiator;

    if (!contributor) {
        contributor = buildContributorProfile(uid, now);
        writes.push(
            db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(uid).set(contributor, { merge: true })
        );
    }

    if (!initiator) {
        initiator = buildInitiatorProfile(uid, now);
        writes.push(
            db.collection(INITIATOR_PROFILES_COLLECTION).doc(uid).set(initiator, { merge: true })
        );
    }

    if (writes.length > 0) {
        await Promise.all(writes);
    }

    return {
        contributor,
        initiator,
    };
};

const getProfilesForUser = async (uid: string): Promise<UserProfilesBundle> => {
    const [contributorDoc, initiatorDoc] = await Promise.all([
        db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(uid).get(),
        db.collection(INITIATOR_PROFILES_COLLECTION).doc(uid).get(),
    ]);

    return {
        contributor: contributorDoc.exists
            ? ({ id: contributorDoc.id, ...contributorDoc.data() } as ContributorProfile)
            : null,
        initiator: initiatorDoc.exists
            ? ({ id: initiatorDoc.id, ...initiatorDoc.data() } as InitiatorProfile)
            : null,
    };
};

const resolveAvailableRoles = (
    user: User,
    profiles: UserProfilesBundle,
    isAdminActive: boolean
): SystemRole[] => {
    if (user.primaryRole === 'admin') {
        return isAdminActive ? ['admin'] : [];
    }

    const roles: SystemRole[] = [];

    if (profiles.contributor) {
        roles.push('contributor');
    }
    if (profiles.initiator) {
        roles.push('initiator');
    }
    if (roles.length === 0) {
        roles.push(user.primaryRole);
    }

    return Array.from(new Set(roles));
};

const resolveActiveRole = (user: User, profiles: UserProfilesBundle): SystemRole => {
    if (user.primaryRole === 'admin') {
        return 'admin';
    }
    if (user.primaryRole === 'contributor' && profiles.contributor) {
        return 'contributor';
    }
    if (user.primaryRole === 'initiator' && profiles.initiator) {
        return 'initiator';
    }
    if (profiles.contributor) {
        return 'contributor';
    }
    if (profiles.initiator) {
        return 'initiator';
    }
    return user.primaryRole;
};

const resolveActiveProfile = (
    activeRole: SystemRole,
    profiles: UserProfilesBundle
): ContributorProfile | InitiatorProfile | null => {
    if (activeRole === 'contributor') return profiles.contributor;
    if (activeRole === 'initiator') return profiles.initiator;
    return null;
};

/**
 * Create a new user and their role-specific profile
 */
export const createUser = async (
    uid: string,
    data: CreateUser
): Promise<UserRoleContext> => {
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

    const contributorProfile = buildContributorProfile(uid, now);
    const initiatorProfile = buildInitiatorProfile(uid, now);

    const batch = db.batch();
    batch.set(db.collection(USERS_COLLECTION).doc(uid), user, { merge: true });
    batch.set(
        db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(uid),
        contributorProfile,
        { merge: true }
    );
    batch.set(
        db.collection(INITIATOR_PROFILES_COLLECTION).doc(uid),
        initiatorProfile,
        { merge: true }
    );
    await batch.commit();

    const profiles: UserProfilesBundle = {
        contributor: contributorProfile,
        initiator: initiatorProfile,
    };
    const activeRole = resolveActiveRole(user, profiles);
    return {
        user,
        profile: resolveActiveProfile(activeRole, profiles),
        profiles,
        availableRoles: resolveAvailableRoles(user, profiles, false),
        activeRole,
    };
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
    const context = await getUserRoleContext(uid);
    if (!context) {
        return { user: null, profile: null };
    }
    return {
        user: context.user,
        profile: context.profile,
    };
};

/**
 * Update user
 */
export const updateUser = async (
    uid: string,
    data: Partial<User>
): Promise<void> => {
    const sanitized = stripUndefinedFields(data as Record<string, unknown>);
    await db.collection(USERS_COLLECTION).doc(uid).set({
        ...sanitized,
        updatedAt: new Date(),
    }, { merge: true });
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

export const getUserRoleContext = async (uid: string): Promise<UserRoleContext | null> => {
    const user = await getUserById(uid);
    if (!user) return null;

    const [rawProfiles, adminAccess] = await Promise.all([
        getProfilesForUser(uid),
        user.primaryRole === 'admin' ? resolveAdminAccess(uid) : Promise.resolve(null),
    ]);

    const profiles = await ensureDualProfilesForNonAdmin(uid, user, rawProfiles);

    const adminActive = Boolean(adminAccess?.isActive);
    const availableRoles = resolveAvailableRoles(user, profiles, adminActive);
    const activeRole = resolveActiveRole(user, profiles);
    const profile = resolveActiveProfile(activeRole, profiles);

    return {
        user,
        profile,
        profiles,
        availableRoles,
        activeRole,
    };
};

export const setActiveRole = async (
    uid: string,
    role: NonAdminRole
): Promise<UserRoleContext> => {
    const context = await getUserRoleContext(uid);
    if (!context) {
        throw new Error('User not found');
    }

    if (context.user.primaryRole === 'admin') {
        throw new Error('Admin account role cannot be switched');
    }

    const hasRequestedRoleProfile = role === 'contributor'
        ? Boolean(context.profiles.contributor)
        : Boolean(context.profiles.initiator);

    if (!hasRequestedRoleProfile) {
        throw new Error('Requested role profile is unavailable');
    }

    await updateUser(uid, { primaryRole: role });

    const updatedContext = await getUserRoleContext(uid);
    if (!updatedContext) {
        throw new Error('User not found');
    }

    return updatedContext;
};

export interface RoleCapabilities {
    currentRole: 'contributor' | 'initiator' | 'admin';
    availableRoles: Array<'contributor' | 'initiator' | 'admin'>;
    routes: typeof ROLE_ROUTES;
    disabledRoles: {
        contributor: string | null;
        initiator: string | null;
        admin: string | null;
    };
}

const buildFallbackRoleCapabilities = (
    currentRole: 'contributor' | 'initiator' | 'admin'
): RoleCapabilities => ({
    currentRole,
    availableRoles: [currentRole],
    routes: ROLE_ROUTES,
    disabledRoles: {
        contributor: currentRole === 'contributor' ? null : 'Contributor role is unavailable for this account',
        initiator: currentRole === 'initiator' ? null : 'Initiator role is unavailable for this account',
        admin: currentRole === 'admin' ? null : 'Admin role is unavailable for this account',
    },
});

export const getRoleCapabilities = async (uid: string): Promise<RoleCapabilities | null> => {
    try {
        const context = await getUserRoleContext(uid);
        if (!context) return null;

        return {
            currentRole: context.activeRole,
            availableRoles: context.availableRoles,
            routes: ROLE_ROUTES,
            disabledRoles: {
                contributor: context.profiles.contributor ? null : 'Contributor profile not found for this account',
                initiator: context.profiles.initiator ? null : 'Initiator profile not found for this account',
                admin: context.user.primaryRole === 'admin' && context.availableRoles.includes('admin')
                    ? null
                    : 'Admin access is unavailable or inactive',
            },
        };
    } catch {
        const user = await getUserById(uid);
        if (!user) return null;
        return buildFallbackRoleCapabilities(user.primaryRole);
    }
};
