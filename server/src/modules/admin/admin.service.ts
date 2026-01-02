import { db } from '../../config/firebase.js';
import type { User, Mission, ContributorProfile, InitiatorProfile } from '../../types/firestore.js';

const USERS_COLLECTION = 'users';
const MISSIONS_COLLECTION = 'missions';
const CONTRIBUTOR_PROFILES_COLLECTION = 'contributorProfiles';
const INITIATOR_PROFILES_COLLECTION = 'initiatorProfiles';

export interface PlatformStats {
    totalUsers: number;
    totalContributors: number;
    totalInitiators: number;
    totalMissions: number;
    activeMissions: number;
    completedMissions: number;
    totalEarnings: number;
}

export const getPlatformStats = async (): Promise<PlatformStats> => {
    const [
        usersSnapshot,
        contributorsSnapshot,
        initiatorsSnapshot,
        missionsSnapshot,
    ] = await Promise.all([
        db.collection(USERS_COLLECTION).count().get(),
        db.collection(CONTRIBUTOR_PROFILES_COLLECTION).count().get(),
        db.collection(INITIATOR_PROFILES_COLLECTION).count().get(),
        db.collection(MISSIONS_COLLECTION).get(),
    ]);

    const missions = missionsSnapshot.docs.map(doc => doc.data() as Mission);
    const activeMissions = missions.filter(m =>
        ['open', 'matching', 'in_progress'].includes(m.status)
    ).length;
    const completedMissions = missions.filter(m => m.status === 'completed').length;

    const contributorDocs = await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).get();
    const totalEarnings = contributorDocs.docs.reduce((sum, doc) => {
        const data = doc.data() as ContributorProfile;
        return sum + (data.totalEarnings || 0);
    }, 0);

    return {
        totalUsers: usersSnapshot.data().count,
        totalContributors: contributorsSnapshot.data().count,
        totalInitiators: initiatorsSnapshot.data().count,
        totalMissions: missions.length,
        activeMissions,
        completedMissions,
        totalEarnings,
    };
};

export interface UserWithDetails extends User {
    profile?: ContributorProfile | InitiatorProfile;
}

export const getAllUsers = async (options: {
    limit?: number;
    offset?: number;
    role?: 'contributor' | 'initiator' | 'admin';
    status?: User['accountStatus'];
}): Promise<{ users: UserWithDetails[]; total: number }> => {
    let query: FirebaseFirestore.Query = db.collection(USERS_COLLECTION);

    if (options.role) {
        query = query.where('primaryRole', '==', options.role);
    }
    if (options.status) {
        query = query.where('accountStatus', '==', options.status);
    }

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    query = query.orderBy('createdAt', 'desc');
    if (options.offset) {
        query = query.offset(options.offset);
    }
    query = query.limit(options.limit || 50);

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserWithDetails));

    return { users, total };
};

export const updateUserStatus = async (
    userId: string,
    status: User['accountStatus']
): Promise<void> => {
    await db.collection(USERS_COLLECTION).doc(userId).update({
        accountStatus: status,
        updatedAt: new Date(),
    });
};

export const verifyUser = async (userId: string): Promise<void> => {
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    if (!userDoc.exists) throw new Error('User not found');

    const user = userDoc.data() as User;

    if (user.primaryRole === 'contributor') {
        await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(userId).update({
            verificationStatus: 'verified',
            verificationDate: new Date(),
        });
    } else if (user.primaryRole === 'initiator') {
        await db.collection(INITIATOR_PROFILES_COLLECTION).doc(userId).update({
            isVerified: true,
            verificationDate: new Date(),
        });
    }
};

export const getAllMissions = async (options: {
    limit?: number;
    offset?: number;
    status?: Mission['status'];
}): Promise<{ missions: Mission[]; total: number }> => {
    let query: FirebaseFirestore.Query = db.collection(MISSIONS_COLLECTION);

    if (options.status) {
        query = query.where('status', '==', options.status);
    }

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    query = query.orderBy('createdAt', 'desc');
    if (options.offset) {
        query = query.offset(options.offset);
    }
    query = query.limit(options.limit || 50);

    const snapshot = await query.get();
    const missions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));

    return { missions, total };
};

export const cancelMission = async (missionId: string): Promise<void> => {
    await db.collection(MISSIONS_COLLECTION).doc(missionId).update({
        status: 'cancelled',
        updatedAt: new Date(),
    });
};

export interface Dispute {
    id: string;
    missionId: string;
    missionTitle: string;
    initiatorId: string;
    contributorId: string;
    reason: string;
    status: 'open' | 'under_review' | 'resolved' | 'dismissed';
    resolution?: string;
    createdAt: Date;
    resolvedAt?: Date;
}

export const getDisputes = async (options: {
    status?: Dispute['status'];
    limit?: number;
}): Promise<Dispute[]> => {
    let query: FirebaseFirestore.Query = db.collection('disputes');

    if (options.status) {
        query = query.where('status', '==', options.status);
    }

    query = query.orderBy('createdAt', 'desc').limit(options.limit || 50);

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dispute));
};

export const resolveDispute = async (
    disputeId: string,
    resolution: string,
    favoredParty: 'initiator' | 'contributor'
): Promise<void> => {
    await db.collection('disputes').doc(disputeId).update({
        status: 'resolved',
        resolution,
        favoredParty,
        resolvedAt: new Date(),
    });
};
