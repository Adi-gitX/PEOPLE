import { db } from '../../config/firebase.js';
import type { InitiatorProfile, User } from '../../types/firestore.js';
import type { UpdateInitiatorProfile } from '../../schemas/index.js';

const INITIATOR_PROFILES_COLLECTION = 'initiatorProfiles';
const USERS_COLLECTION = 'users';

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
    const normalizedData = stripUndefinedFields({
        companyName: normalizeOptionalText(data.companyName),
        companyUrl: normalizeOptionalUrl(data.companyUrl),
        companySize: data.companySize,
        industry: normalizeOptionalText(data.industry),
    });

    const now = new Date();
    const profileRef = db.collection(INITIATOR_PROFILES_COLLECTION).doc(uid);
    const snapshot = await profileRef.get();

    if (!snapshot.exists) {
        const fallbackProfile: FirebaseFirestore.DocumentData = {
            userId: uid,
            isVerified: false,
            totalMissionsPosted: 0,
            totalSpent: 0,
            averageRating: 0,
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
