import { db } from '../config/firebase.js';
import type { ContributorProfile, InitiatorProfile, User } from '../types/firestore.js';

const USERS_COLLECTION = 'users';
const CONTRIBUTOR_PROFILES_COLLECTION = 'contributorProfiles';
const INITIATOR_PROFILES_COLLECTION = 'initiatorProfiles';
const MAX_BATCH_WRITES = 400;

const shouldApply = process.argv.includes('--apply');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number.parseInt(limitArg.split('=')[1] || '', 10) : undefined;

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

const run = async (): Promise<void> => {
    if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
        throw new Error('Invalid --limit value. Expected positive integer.');
    }

    console.log(`[DUAL_ROLE][START] mode=${shouldApply ? 'apply' : 'dry-run'}${limit ? ` limit=${limit}` : ''}`);

    const [usersSnapshot, contributorSnapshot, initiatorSnapshot] = await Promise.all([
        db.collection(USERS_COLLECTION).get(),
        db.collection(CONTRIBUTOR_PROFILES_COLLECTION).get(),
        db.collection(INITIATOR_PROFILES_COLLECTION).get(),
    ]);

    const contributorIds = new Set(contributorSnapshot.docs.map((doc) => doc.id));
    const initiatorIds = new Set(initiatorSnapshot.docs.map((doc) => doc.id));

    const allUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data() as User,
    }));

    const targetUsers = typeof limit === 'number' ? allUsers.slice(0, limit) : allUsers;

    let scanned = 0;
    let adminsSkipped = 0;
    let usersWithChanges = 0;
    let contributorMissing = 0;
    let initiatorMissing = 0;
    let contributorCreated = 0;
    let initiatorCreated = 0;

    let batch = db.batch();
    let pendingWrites = 0;
    let committedBatches = 0;

    const commitBatch = async (): Promise<void> => {
        if (!shouldApply || pendingWrites === 0) return;
        await batch.commit();
        committedBatches += 1;
        batch = db.batch();
        pendingWrites = 0;
    };

    for (const { id, data } of targetUsers) {
        if (!data || data.primaryRole === 'admin') {
            adminsSkipped += 1;
            continue;
        }

        scanned += 1;
        const now = new Date();

        const needsContributor = !contributorIds.has(id);
        const needsInitiator = !initiatorIds.has(id);

        if (!needsContributor && !needsInitiator) {
            continue;
        }

        usersWithChanges += 1;

        if (needsContributor) {
            contributorMissing += 1;
            if (shouldApply) {
                batch.set(
                    db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(id),
                    buildContributorProfile(id, now),
                    { merge: true }
                );
                contributorCreated += 1;
                pendingWrites += 1;
            }
        }

        if (needsInitiator) {
            initiatorMissing += 1;
            if (shouldApply) {
                batch.set(
                    db.collection(INITIATOR_PROFILES_COLLECTION).doc(id),
                    buildInitiatorProfile(id, now),
                    { merge: true }
                );
                initiatorCreated += 1;
                pendingWrites += 1;
            }
        }

        if (pendingWrites >= MAX_BATCH_WRITES) {
            await commitBatch();
        }
    }

    await commitBatch();

    console.log(
        [
            '[DUAL_ROLE][DONE]',
            `scanned_non_admin=${scanned}`,
            `admins_skipped=${adminsSkipped}`,
            `users_missing_profiles=${usersWithChanges}`,
            `missing_contributor=${contributorMissing}`,
            `missing_initiator=${initiatorMissing}`,
            `created_contributor=${contributorCreated}`,
            `created_initiator=${initiatorCreated}`,
            `batches=${committedBatches}`,
            `mode=${shouldApply ? 'apply' : 'dry-run'}`,
        ].join(' ')
    );
};

run().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[DUAL_ROLE][FAIL] ${message}`);
    process.exit(1);
});
