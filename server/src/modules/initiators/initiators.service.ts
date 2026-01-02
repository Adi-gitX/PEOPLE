import { db } from '../../config/firebase.js';
import type { InitiatorProfile, User } from '../../types/firestore.js';
import type { UpdateInitiatorProfile } from '../../schemas/index.js';

const INITIATOR_PROFILES_COLLECTION = 'initiatorProfiles';
const USERS_COLLECTION = 'users';

export const getInitiatorById = async (uid: string): Promise<{
    user: User | null;
    profile: InitiatorProfile | null;
}> => {
    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (!userDoc.exists) return { user: null, profile: null };

    const user = { id: userDoc.id, ...userDoc.data() } as User;

    const profileDoc = await db.collection(INITIATOR_PROFILES_COLLECTION).doc(uid).get();
    const profile = profileDoc.exists
        ? ({ id: profileDoc.id, ...profileDoc.data() } as InitiatorProfile)
        : null;

    return { user, profile };
};

export const updateInitiatorProfile = async (
    uid: string,
    data: UpdateInitiatorProfile
): Promise<void> => {
    await db.collection(INITIATOR_PROFILES_COLLECTION).doc(uid).update({
        ...data,
        updatedAt: new Date(),
    });
};

export const getInitiators = async (options?: {
    limit?: number;
    verifiedOnly?: boolean;
}): Promise<InitiatorProfile[]> => {
    let query = db.collection(INITIATOR_PROFILES_COLLECTION)
        .orderBy('createdAt', 'desc');

    if (options?.verifiedOnly) {
        query = query.where('isVerified', '==', true);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InitiatorProfile));
};

export const incrementMissionsPosted = async (uid: string): Promise<void> => {
    const profileRef = db.collection(INITIATOR_PROFILES_COLLECTION).doc(uid);
    const profile = await profileRef.get();

    if (profile.exists) {
        const current = profile.data()?.totalMissionsPosted || 0;
        await profileRef.update({
            totalMissionsPosted: current + 1,
            updatedAt: new Date(),
        });
    }
};

export const incrementTotalSpent = async (uid: string, amount: number): Promise<void> => {
    const profileRef = db.collection(INITIATOR_PROFILES_COLLECTION).doc(uid);
    const profile = await profileRef.get();

    if (profile.exists) {
        const current = profile.data()?.totalSpent || 0;
        await profileRef.update({
            totalSpent: current + amount,
            updatedAt: new Date(),
        });
    }
};
