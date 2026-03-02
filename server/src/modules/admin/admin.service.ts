import { auth, db } from '../../config/firebase.js';
import {
    resolveAdminAccess,
    type AdminAccessContext,
    type AdminScope,
    type AdminType,
    ALL_ADMIN_SCOPES,
} from '../../middleware/admin.js';
import type {
    User,
    Mission,
    ContributorProfile,
    InitiatorProfile,
    Conversation,
    Message,
    WithdrawalRequest,
    EscrowAccount,
    AdminAuditLog,
    AdminProfile,
} from '../../types/firestore.js';

const USERS_COLLECTION = 'users';
const MISSIONS_COLLECTION = 'missions';
const CONTRIBUTOR_PROFILES_COLLECTION = 'contributorProfiles';
const INITIATOR_PROFILES_COLLECTION = 'initiatorProfiles';
const CONVERSATIONS_COLLECTION = 'conversations';
const WITHDRAWALS_COLLECTION = 'withdrawalRequests';
const PAYMENT_INTENTS_COLLECTION = 'paymentIntents';
const ESCROW_ACCOUNTS_COLLECTION = 'escrowAccounts';
const ADMIN_PROFILES_COLLECTION = 'adminProfiles';
const ADMIN_AUDIT_LOGS_COLLECTION = 'adminAuditLogs';

type DateLike = Date | FirebaseFirestore.Timestamp | string | undefined;

const toDate = (value: DateLike): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const possible = value as FirebaseFirestore.Timestamp;
    if (typeof possible.toDate === 'function') {
        return possible.toDate();
    }
    return null;
};

const toIsoString = (value: DateLike): string | null => {
    const date = toDate(value);
    return date ? date.toISOString() : null;
};

const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

const sanitizeSearch = (value: string | undefined): string => {
    return (value || '').trim().toLowerCase();
};

const docHasAfterDate = (value: DateLike, dateFrom: Date | null): boolean => {
    if (!dateFrom) return true;
    const current = toDate(value);
    if (!current) return false;
    return current.getTime() >= dateFrom.getTime();
};

const docHasBeforeDate = (value: DateLike, dateTo: Date | null): boolean => {
    if (!dateTo) return true;
    const current = toDate(value);
    if (!current) return false;
    return current.getTime() <= dateTo.getTime();
};

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

    const missions = missionsSnapshot.docs.map((doc) => doc.data() as Mission);
    const activeMissions = missions.filter((mission) =>
        ['open', 'matching', 'in_progress'].includes(mission.status)
    ).length;
    const completedMissions = missions.filter((mission) => mission.status === 'completed').length;

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
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserWithDetails));

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
    const missions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Mission));

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
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Dispute));
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

export interface AdminScopeSummary {
    userId: string;
    adminType: AdminType;
    scopes: AdminScope[];
    isActive: boolean;
    mfaRequired: boolean;
    mfaEnrolled: boolean;
    mfaSatisfied: boolean;
    mfaFactor: string | null;
    mfaEnforcementMode: 'warn' | 'enforce';
    mfaEnrolledAt?: DateLike | null;
    lastMfaResetAt?: DateLike | null;
    lastMfaResetBy?: string | null;
}

export const getAdminScopeSummary = async (
    userId: string,
    preResolved?: AdminAccessContext | null
): Promise<AdminScopeSummary | null> => {
    const access = preResolved || await resolveAdminAccess(userId);
    if (!access) return null;
    return {
        userId: access.userId,
        adminType: access.adminType,
        scopes: access.scopes,
        isActive: access.isActive,
        mfaRequired: access.mfaRequired,
        mfaEnrolled: access.mfaEnrolled,
        mfaSatisfied: access.mfaSatisfied,
        mfaFactor: access.mfaFactor,
        mfaEnforcementMode: access.mfaEnforcementMode,
        mfaEnrolledAt: access.mfaEnrolledAt ?? null,
        lastMfaResetAt: access.lastMfaResetAt ?? null,
        lastMfaResetBy: access.lastMfaResetBy ?? null,
    };
};

export const bootstrapAdminProfiles = async (): Promise<{ scanned: number; created: number; skipped: number }> => {
    const adminUsersSnapshot = await db
        .collection(USERS_COLLECTION)
        .where('primaryRole', '==', 'admin')
        .get();

    let created = 0;
    const now = new Date();
    const batch = db.batch();

    adminUsersSnapshot.docs.forEach((doc) => {
        const profileRef = db.collection(ADMIN_PROFILES_COLLECTION).doc(doc.id);
        batch.set(profileRef, {
            userId: doc.id,
            adminType: 'super_admin',
            scopes: [],
            isActive: true,
            mfaRequired: false,
            updatedAt: now,
            createdAt: now,
        }, { merge: true });
        created += 1;
    });

    if (!adminUsersSnapshot.empty) {
        await batch.commit();
    }

    return {
        scanned: adminUsersSnapshot.size,
        created,
        skipped: 0,
    };
};

export interface AdminAuditLogInput {
    actorId: string;
    scope: AdminScope;
    action: string;
    resourceType: string;
    resourceId?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
}

export const writeAdminAuditLog = async (input: AdminAuditLogInput): Promise<void> => {
    const now = new Date();
    const logRecord: Omit<AdminAuditLog, 'id'> = {
        actorId: input.actorId,
        actorType: 'admin',
        scope: input.scope,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        reason: input.reason,
        metadata: input.metadata || {},
        createdAt: now,
        updatedAt: now,
    };

    await db.collection(ADMIN_AUDIT_LOGS_COLLECTION).add(logRecord);
};

const stripUndefined = <T extends Record<string, unknown>>(payload: T): Partial<T> => {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
};

const normalizePersistedScopes = (adminType: AdminType, scopes: AdminScope[] | undefined): AdminScope[] => {
    if (adminType === 'super_admin') {
        return [];
    }
    if (!scopes || scopes.length === 0) {
        return [];
    }

    const whitelist = new Set<AdminScope>(ALL_ADMIN_SCOPES);
    return Array.from(new Set(scopes.filter((scope) => whitelist.has(scope))));
};

export interface AdminUserItem {
    uid: string;
    email: string | null;
    fullName: string;
    primaryRole: 'admin';
    accountStatus: User['accountStatus'];
    adminType: AdminType;
    scopes: AdminScope[];
    isActive: boolean;
    mfaRequired: boolean;
    mfaEnrolled: boolean;
    mfaEnrolledAt: string | null;
    lastMfaResetAt: string | null;
    lastMfaResetBy: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

const getAdminUserItemByUid = async (uid: string): Promise<AdminUserItem | null> => {
    const [userDoc, profileDoc] = await Promise.all([
        db.collection(USERS_COLLECTION).doc(uid).get(),
        db.collection(ADMIN_PROFILES_COLLECTION).doc(uid).get(),
    ]);

    if (!userDoc.exists) {
        return null;
    }

    const userData = userDoc.data() as User;
    if (userData.primaryRole !== 'admin') {
        return null;
    }

    const profileData = profileDoc.exists ? (profileDoc.data() as AdminProfile) : null;

    let mfaEnrolled = false;
    try {
        const authUser = await auth.getUser(uid);
        mfaEnrolled = (authUser.multiFactor?.enrolledFactors?.length || 0) > 0;
    } catch {
        mfaEnrolled = false;
    }

    const adminType = profileData?.adminType || 'super_admin';

    return {
        uid,
        email: userData.email || null,
        fullName: userData.fullName || 'Admin User',
        primaryRole: 'admin',
        accountStatus: userData.accountStatus || 'active',
        adminType,
        scopes: (profileData?.scopes || []) as AdminScope[],
        isActive: profileData?.isActive !== false,
        mfaRequired: profileData?.mfaRequired ?? false,
        mfaEnrolled,
        mfaEnrolledAt: toIsoString(profileData?.mfaEnrolledAt as DateLike),
        lastMfaResetAt: toIsoString(profileData?.lastMfaResetAt as DateLike),
        lastMfaResetBy: profileData?.lastMfaResetBy || null,
        createdAt: toIsoString(userData.createdAt as DateLike),
        updatedAt: toIsoString(userData.updatedAt as DateLike),
    };
};

export const listAdminUsers = async (options: {
    q?: string;
    adminType?: AdminType;
    isActive?: boolean;
    limit?: number;
    cursor?: string;
}): Promise<{ admins: AdminUserItem[]; nextCursor: string | null }> => {
    const limit = clamp(options.limit || 30, 1, 100);
    const search = sanitizeSearch(options.q);

    let query: FirebaseFirestore.Query = db
        .collection(USERS_COLLECTION)
        .where('primaryRole', '==', 'admin')
        .orderBy('createdAt', 'desc')
        .limit(limit * 4);

    if (options.cursor) {
        const cursorDoc = await db.collection(USERS_COLLECTION).doc(options.cursor).get();
        if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
        }
    }

    const snapshot = await query.get();
    const rows = await Promise.all(
        snapshot.docs.map((doc) => getAdminUserItemByUid(doc.id))
    );

    const filtered = rows
        .filter((row): row is AdminUserItem => Boolean(row))
        .filter((row) => {
            if (options.adminType && row.adminType !== options.adminType) return false;
            if (typeof options.isActive === 'boolean' && row.isActive !== options.isActive) return false;
            if (search) {
                const haystack = `${row.uid} ${row.email || ''} ${row.fullName}`.toLowerCase();
                if (!haystack.includes(search)) return false;
            }
            return true;
        })
        .slice(0, limit);

    const nextCursor = filtered.length > 0 ? filtered[filtered.length - 1].uid : null;
    return { admins: filtered, nextCursor };
};

export const createAdminUser = async (input: {
    uid?: string;
    email?: string;
    adminType: AdminType;
    scopes?: AdminScope[];
    isActive?: boolean;
    mfaRequired?: boolean;
}): Promise<AdminUserItem> => {
    let targetUid = input.uid;

    if (!targetUid && input.email) {
        const byEmailSnapshot = await db
            .collection(USERS_COLLECTION)
            .where('email', '==', input.email)
            .limit(1)
            .get();

        if (!byEmailSnapshot.empty) {
            targetUid = byEmailSnapshot.docs[0].id;
        } else {
            const authUser = await auth.getUserByEmail(input.email);
            targetUid = authUser.uid;
        }
    }

    if (!targetUid) {
        throw new Error('Target user not found');
    }

    let authUser: Awaited<ReturnType<typeof auth.getUser>> | null = null;
    try {
        authUser = await auth.getUser(targetUid);
    } catch {
        authUser = null;
    }

    const userRef = db.collection(USERS_COLLECTION).doc(targetUid);
    const adminRef = db.collection(ADMIN_PROFILES_COLLECTION).doc(targetUid);
    const [existingUserDoc, existingProfileDoc] = await Promise.all([userRef.get(), adminRef.get()]);
    const existingUser = existingUserDoc.exists ? (existingUserDoc.data() as User) : null;
    const now = new Date();

    const userPayload = stripUndefined({
        email: existingUser?.email || authUser?.email || input.email || '',
        emailVerified: authUser?.emailVerified ?? existingUser?.emailVerified ?? false,
        fullName: existingUser?.fullName || authUser?.displayName || 'Admin User',
        primaryRole: 'admin',
        accountStatus: existingUser?.accountStatus || 'active',
        updatedAt: now,
        createdAt: existingUserDoc.exists ? undefined : now,
    });

    const profilePayload = stripUndefined({
        userId: targetUid,
        adminType: input.adminType,
        scopes: normalizePersistedScopes(input.adminType, input.scopes),
        isActive: input.isActive ?? true,
        mfaRequired: input.mfaRequired ?? false,
        updatedAt: now,
        createdAt: existingProfileDoc.exists ? undefined : now,
    });

    await Promise.all([
        userRef.set(userPayload, { merge: true }),
        adminRef.set(profilePayload, { merge: true }),
    ]);

    const item = await getAdminUserItemByUid(targetUid);
    if (!item) throw new Error('Failed to create admin user');
    return item;
};

export const updateAdminUser = async (
    uid: string,
    updates: {
        adminType?: AdminType;
        scopes?: AdminScope[];
        isActive?: boolean;
        mfaRequired?: boolean;
    }
): Promise<AdminUserItem> => {
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const profileRef = db.collection(ADMIN_PROFILES_COLLECTION).doc(uid);
    const [userDoc, profileDoc] = await Promise.all([userRef.get(), profileRef.get()]);

    if (!userDoc.exists) {
        throw new Error('User not found');
    }

    const userData = userDoc.data() as User;
    if (userData.primaryRole !== 'admin') {
        throw new Error('Target user is not an admin');
    }

    const profileData = profileDoc.exists ? (profileDoc.data() as AdminProfile) : null;
    const nextAdminType = updates.adminType || profileData?.adminType || 'super_admin';
    const now = new Date();

    const updatePayload = stripUndefined({
        userId: uid,
        adminType: nextAdminType,
        scopes: updates.scopes !== undefined
            ? normalizePersistedScopes(nextAdminType, updates.scopes)
            : profileData?.scopes,
        isActive: updates.isActive,
        mfaRequired: updates.mfaRequired,
        updatedAt: now,
        createdAt: profileDoc.exists ? undefined : now,
    });

    await profileRef.set(updatePayload, { merge: true });

    const item = await getAdminUserItemByUid(uid);
    if (!item) throw new Error('Failed to update admin user');
    return item;
};

export const resetAdminUserMfa = async (params: {
    uid: string;
    actorId: string;
}): Promise<AdminUserItem> => {
    const now = new Date();

    await auth.updateUser(params.uid, {
        multiFactor: {
            enrolledFactors: [],
        },
    });

    await db.collection(ADMIN_PROFILES_COLLECTION).doc(params.uid).set({
        userId: params.uid,
        mfaEnrolledAt: null,
        lastMfaResetAt: now,
        lastMfaResetBy: params.actorId,
        updatedAt: now,
    }, { merge: true });

    const item = await getAdminUserItemByUid(params.uid);
    if (!item) throw new Error('Admin user not found');
    return item;
};

export interface AdminSecuritySummary {
    userId: string;
    adminType: AdminType;
    mfaRequired: boolean;
    mfaEnrolled: boolean;
    mfaSatisfied: boolean;
    mfaFactor: string | null;
    mfaEnforcementMode: 'warn' | 'enforce';
    mfaEnrolledAt: string | null;
    lastMfaResetAt: string | null;
    lastMfaResetBy: string | null;
    enrolledFactors: Array<{ uid: string; factorId: string; displayName?: string | null; enrollmentTime?: string | null }>;
}

export const getAdminSecuritySummary = async (
    userId: string,
    preResolved?: AdminAccessContext | null
): Promise<AdminSecuritySummary | null> => {
    const access = preResolved || await resolveAdminAccess(userId);
    if (!access) return null;

    const userRecord = await auth.getUser(userId);
    const factors = userRecord.multiFactor?.enrolledFactors || [];
    const enrolledFactors = factors.map((factor) => ({
        uid: factor.uid,
        factorId: factor.factorId,
        displayName: factor.displayName || null,
        enrollmentTime: factor.enrollmentTime || null,
    }));

    if (factors.length > 0 && !access.mfaEnrolledAt) {
        await db.collection(ADMIN_PROFILES_COLLECTION).doc(userId).set({
            userId,
            mfaEnrolledAt: new Date(),
            updatedAt: new Date(),
        }, { merge: true });
    }

    return {
        userId: access.userId,
        adminType: access.adminType,
        mfaRequired: access.mfaRequired,
        mfaEnrolled: factors.length > 0,
        mfaSatisfied: access.mfaSatisfied,
        mfaFactor: access.mfaFactor,
        mfaEnforcementMode: access.mfaEnforcementMode,
        mfaEnrolledAt: toIsoString(access.mfaEnrolledAt as DateLike),
        lastMfaResetAt: toIsoString(access.lastMfaResetAt as DateLike),
        lastMfaResetBy: access.lastMfaResetBy || null,
        enrolledFactors,
    };
};

interface ParticipantDisplay {
    id: string;
    fullName: string;
    avatarUrl?: string;
}

export interface AdminConversationListItem {
    id: string;
    type: Conversation['type'];
    missionId?: string;
    participants: string[];
    participantProfiles: ParticipantDisplay[];
    lastMessageAt?: string | null;
    lastMessage?: string | null;
    moderationStatus: 'normal' | 'locked';
    moderationReason?: string | null;
    moderatedBy?: string | null;
    moderatedAt?: string | null;
    unreadEstimate: number;
}

const buildParticipantMap = async (userIds: string[]): Promise<Record<string, ParticipantDisplay>> => {
    const uniqueIds = Array.from(new Set(userIds));
    const entries = await Promise.all(uniqueIds.map(async (userId) => {
        const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
        const fullName = userDoc.exists ? (userDoc.data()?.fullName || 'Unknown') : 'Unknown';
        const avatarUrl = userDoc.exists ? userDoc.data()?.avatarUrl : undefined;
        return [userId, { id: userId, fullName, avatarUrl }] as const;
    }));

    return Object.fromEntries(entries);
};

const estimateUnreadMessages = async (conversationId: string): Promise<number> => {
    const messagesSnapshot = await db
        .collection(CONVERSATIONS_COLLECTION)
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

    return messagesSnapshot.docs.reduce((count, doc) => {
        const data = doc.data() as Message;
        if (data.isDeleted || data.isModeratedHidden) return count;
        const readBy = Array.isArray(data.readBy) ? data.readBy : [];
        return readBy.length < 2 ? count + 1 : count;
    }, 0);
};

const getLatestMessageText = async (conversationId: string): Promise<string | null> => {
    const snapshot = await db
        .collection(CONVERSATIONS_COLLECTION)
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data() as Message;
    return data.content || null;
};

export const listAdminConversations = async (options: {
    q?: string;
    status?: 'normal' | 'locked';
    missionId?: string;
    participantId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    cursor?: string;
}): Promise<{ conversations: AdminConversationListItem[]; nextCursor: string | null }> => {
    const limit = clamp(options.limit || 25, 1, 100);
    const search = sanitizeSearch(options.q);
    const dateFrom = options.dateFrom ? toDate(options.dateFrom) : null;
    const dateTo = options.dateTo ? toDate(options.dateTo) : null;

    let query: FirebaseFirestore.Query = db
        .collection(CONVERSATIONS_COLLECTION)
        .orderBy('lastMessageAt', 'desc')
        .limit(limit * 4);

    if (options.cursor) {
        const cursorDoc = await db.collection(CONVERSATIONS_COLLECTION).doc(options.cursor).get();
        if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
        }
    }

    const snapshot = await query.get();
    const rawConversations = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Conversation));

    const participantIds = rawConversations.flatMap((conversation) => conversation.participants || []);
    const participantMap = await buildParticipantMap(participantIds);

    const filtered = rawConversations.filter((conversation) => {
        const moderationStatus = (conversation.moderationStatus || 'normal') as 'normal' | 'locked';
        if (options.status && moderationStatus !== options.status) return false;
        if (options.missionId && conversation.missionId !== options.missionId) return false;
        if (options.participantId && !(conversation.participants || []).includes(options.participantId)) return false;
        if (!docHasAfterDate(conversation.lastMessageAt, dateFrom)) return false;
        if (!docHasBeforeDate(conversation.lastMessageAt, dateTo)) return false;
        return true;
    });

    const conversations = await Promise.all(
        filtered.map(async (conversation) => {
            const participantProfiles = (conversation.participants || []).map((participantId) => (
                participantMap[participantId] || { id: participantId, fullName: 'Unknown' }
            ));

            const fallbackLastMessage = conversation.lastMessage || await getLatestMessageText(conversation.id || '');
            const unreadEstimate = await estimateUnreadMessages(conversation.id || '');

            return {
                id: conversation.id || '',
                type: conversation.type,
                missionId: conversation.missionId,
                participants: conversation.participants || [],
                participantProfiles,
                lastMessageAt: toIsoString(conversation.lastMessageAt),
                lastMessage: fallbackLastMessage,
                moderationStatus: (conversation.moderationStatus || 'normal') as 'normal' | 'locked',
                moderationReason: conversation.moderationReason || null,
                moderatedBy: conversation.moderatedBy || null,
                moderatedAt: toIsoString(conversation.moderatedAt),
                unreadEstimate,
            } as AdminConversationListItem;
        })
    );

    const searched = search
        ? conversations.filter((conversation) => {
            const haystack = [
                conversation.lastMessage || '',
                ...conversation.participantProfiles.map((profile) => profile.fullName),
            ].join(' ').toLowerCase();
            return haystack.includes(search);
        })
        : conversations;

    const sliced = searched.slice(0, limit);
    const nextCursor = sliced.length > 0 ? sliced[sliced.length - 1].id : null;

    return { conversations: sliced, nextCursor };
};

export interface AdminMessageView {
    id: string;
    conversationId: string;
    senderId: string;
    senderName?: string;
    content: string;
    messageType: Message['messageType'];
    createdAt: string | null;
    readBy: string[];
    isEdited: boolean;
    isDeleted: boolean;
    isModeratedHidden: boolean;
    moderationReason?: string | null;
    moderatedBy?: string | null;
    moderatedAt?: string | null;
}

export const listAdminConversationMessages = async (
    conversationId: string,
    options: { limit?: number; before?: string }
): Promise<{ conversation: Conversation | null; messages: AdminMessageView[] }> => {
    const conversationDoc = await db.collection(CONVERSATIONS_COLLECTION).doc(conversationId).get();
    if (!conversationDoc.exists) {
        return { conversation: null, messages: [] };
    }

    const conversation = { id: conversationDoc.id, ...conversationDoc.data() } as Conversation;
    let query: FirebaseFirestore.Query = db
        .collection(CONVERSATIONS_COLLECTION)
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(clamp(options.limit || 100, 1, 200));

    if (options.before) {
        const cursorDoc = await db
            .collection(CONVERSATIONS_COLLECTION)
            .doc(conversationId)
            .collection('messages')
            .doc(options.before)
            .get();
        if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
        }
    }

    const snapshot = await query.get();
    const messages = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Message))
        .reverse()
        .map((message) => ({
            id: message.id || '',
            conversationId: message.conversationId,
            senderId: message.senderId,
            senderName: message.senderName,
            content: message.content,
            messageType: message.messageType,
            createdAt: toIsoString(message.createdAt),
            readBy: Array.isArray(message.readBy) ? message.readBy : [],
            isEdited: Boolean(message.isEdited),
            isDeleted: Boolean(message.isDeleted),
            isModeratedHidden: Boolean(message.isModeratedHidden),
            moderationReason: message.moderationReason || null,
            moderatedBy: message.moderatedBy || null,
            moderatedAt: toIsoString(message.moderatedAt),
        }));

    return { conversation, messages };
};

export const moderateConversation = async (params: {
    conversationId: string;
    action: 'lock' | 'unlock';
    reason: string;
    actorId: string;
}): Promise<Conversation | null> => {
    const conversationRef = db.collection(CONVERSATIONS_COLLECTION).doc(params.conversationId);
    const snapshot = await conversationRef.get();
    if (!snapshot.exists) return null;

    const now = new Date();
    await conversationRef.update({
        moderationStatus: params.action === 'lock' ? 'locked' : 'normal',
        moderationReason: params.reason,
        moderatedBy: params.actorId,
        moderatedAt: now,
        updatedAt: now,
    });

    const updated = await conversationRef.get();
    return { id: updated.id, ...updated.data() } as Conversation;
};

export const moderateMessage = async (params: {
    conversationId: string;
    messageId: string;
    action: 'hide' | 'restore';
    reason: string;
    actorId: string;
}): Promise<Message | null> => {
    const messageRef = db
        .collection(CONVERSATIONS_COLLECTION)
        .doc(params.conversationId)
        .collection('messages')
        .doc(params.messageId);

    const snapshot = await messageRef.get();
    if (!snapshot.exists) return null;

    const now = new Date();
    await messageRef.update({
        isModeratedHidden: params.action === 'hide',
        moderationReason: params.reason,
        moderatedBy: params.actorId,
        moderatedAt: now,
        updatedAt: now,
    });

    const updated = await messageRef.get();
    return { id: updated.id, ...updated.data() } as Message;
};

export const listAdminWithdrawals = async (options: {
    status?: WithdrawalRequest['status'];
    limit?: number;
    cursor?: string;
}): Promise<{ withdrawals: WithdrawalRequest[]; nextCursor: string | null }> => {
    let query: FirebaseFirestore.Query = db
        .collection(WITHDRAWALS_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(clamp(options.limit || 30, 1, 100));

    if (options.status) {
        query = db
            .collection(WITHDRAWALS_COLLECTION)
            .where('status', '==', options.status)
            .orderBy('createdAt', 'desc')
            .limit(clamp(options.limit || 30, 1, 100));
    }

    if (options.cursor) {
        const cursorDoc = await db.collection(WITHDRAWALS_COLLECTION).doc(options.cursor).get();
        if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
        }
    }

    const snapshot = await query.get();
    const withdrawals = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));
    const nextCursor = withdrawals.length > 0 ? withdrawals[withdrawals.length - 1].id || null : null;

    return { withdrawals, nextCursor };
};

export interface AdminPaymentIntentItem {
    id: string;
    missionId: string;
    escrowId: string;
    initiatorId: string;
    provider: 'stripe' | 'razorpay';
    status: 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'cancelled';
    amountMinor: number;
    currency: string;
    createdAt: string | null;
    updatedAt: string | null;
    providerIntentId?: string;
    providerOrderId?: string;
    providerPaymentId?: string;
}

interface PaymentIntentRecord {
    id: string;
    missionId?: string;
    escrowId?: string;
    initiatorId?: string;
    provider?: 'stripe' | 'razorpay';
    status?: 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'cancelled';
    amountMinor?: number;
    currency?: string;
    createdAt?: DateLike;
    updatedAt?: DateLike;
    providerIntentId?: string;
    providerOrderId?: string;
    providerPaymentId?: string;
}

export const listAdminPaymentIntents = async (options: {
    provider?: 'stripe' | 'razorpay';
    status?: 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'cancelled';
    missionId?: string;
    initiatorId?: string;
    limit?: number;
    cursor?: string;
}): Promise<{ intents: AdminPaymentIntentItem[]; nextCursor: string | null }> => {
    const limit = clamp(options.limit || 30, 1, 100);
    let query: FirebaseFirestore.Query = db
        .collection(PAYMENT_INTENTS_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(limit * 4);

    if (options.cursor) {
        const cursorDoc = await db.collection(PAYMENT_INTENTS_COLLECTION).doc(options.cursor).get();
        if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
        }
    }

    const snapshot = await query.get();
    const intents = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as PaymentIntentRecord))
        .filter((intent) => {
            if (options.provider && intent.provider !== options.provider) return false;
            if (options.status && intent.status !== options.status) return false;
            if (options.missionId && intent.missionId !== options.missionId) return false;
            if (options.initiatorId && intent.initiatorId !== options.initiatorId) return false;
            return true;
        })
        .slice(0, limit)
        .map((intent) => ({
            id: String(intent.id),
            missionId: String(intent.missionId || ''),
            escrowId: String(intent.escrowId || ''),
            initiatorId: String(intent.initiatorId || ''),
            provider: (intent.provider || 'stripe') as 'stripe' | 'razorpay',
            status: (intent.status || 'pending') as 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'cancelled',
            amountMinor: Number(intent.amountMinor || 0),
            currency: String(intent.currency || 'USD'),
            createdAt: toIsoString(intent.createdAt as DateLike),
            updatedAt: toIsoString(intent.updatedAt as DateLike),
            providerIntentId: typeof intent.providerIntentId === 'string' ? intent.providerIntentId : undefined,
            providerOrderId: typeof intent.providerOrderId === 'string' ? intent.providerOrderId : undefined,
            providerPaymentId: typeof intent.providerPaymentId === 'string' ? intent.providerPaymentId : undefined,
        }));

    const nextCursor = intents.length > 0 ? intents[intents.length - 1].id : null;
    return { intents, nextCursor };
};

export const listAdminEscrowAccounts = async (options: {
    status?: EscrowAccount['status'];
    missionId?: string;
    initiatorId?: string;
    limit?: number;
    cursor?: string;
}): Promise<{ accounts: EscrowAccount[]; nextCursor: string | null }> => {
    const limit = clamp(options.limit || 30, 1, 100);
    let query: FirebaseFirestore.Query = db
        .collection(ESCROW_ACCOUNTS_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(limit * 4);

    if (options.cursor) {
        const cursorDoc = await db.collection(ESCROW_ACCOUNTS_COLLECTION).doc(options.cursor).get();
        if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
        }
    }

    const snapshot = await query.get();
    const accounts = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as EscrowAccount))
        .filter((account) => {
            if (options.status && account.status !== options.status) return false;
            if (options.missionId && account.missionId !== options.missionId) return false;
            if (options.initiatorId && account.initiatorId !== options.initiatorId) return false;
            return true;
        })
        .slice(0, limit);

    const nextCursor = accounts.length > 0 ? accounts[accounts.length - 1].id || null : null;
    return { accounts, nextCursor };
};

export const listAdminAuditLogs = async (options: {
    actorId?: string;
    scope?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    cursor?: string;
}): Promise<{ logs: AdminAuditLog[]; nextCursor: string | null }> => {
    const limit = clamp(options.limit || 50, 1, 100);
    const dateFrom = options.dateFrom ? toDate(options.dateFrom) : null;
    const dateTo = options.dateTo ? toDate(options.dateTo) : null;

    let query: FirebaseFirestore.Query = db
        .collection(ADMIN_AUDIT_LOGS_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(limit * 4);

    if (options.cursor) {
        const cursorDoc = await db.collection(ADMIN_AUDIT_LOGS_COLLECTION).doc(options.cursor).get();
        if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
        }
    }

    const snapshot = await query.get();
    const logs = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as AdminAuditLog))
        .filter((log) => {
            if (options.actorId && log.actorId !== options.actorId) return false;
            if (options.scope && log.scope !== options.scope) return false;
            if (options.action && log.action !== options.action) return false;
            if (options.resourceType && log.resourceType !== options.resourceType) return false;
            if (options.resourceId && log.resourceId !== options.resourceId) return false;
            if (!docHasAfterDate(log.createdAt, dateFrom)) return false;
            if (!docHasBeforeDate(log.createdAt, dateTo)) return false;
            return true;
        })
        .slice(0, limit);

    const nextCursor = logs.length > 0 ? logs[logs.length - 1].id || null : null;
    return { logs, nextCursor };
};
