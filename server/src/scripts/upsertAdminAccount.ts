import { auth, db } from '../config/firebase.js';
import { env } from '../config/env.js';

const USERS_COLLECTION = 'users';
const ADMIN_PROFILES_COLLECTION = 'adminProfiles';
const allowedTypes = new Set(['super_admin', 'support_admin', 'ops_admin', 'trust_safety']);

const resolveAdminType = (value: string | undefined): 'super_admin' | 'support_admin' | 'ops_admin' | 'trust_safety' => {
    if (!value) return 'super_admin';
    return (allowedTypes.has(value) ? value : 'super_admin') as 'super_admin' | 'support_admin' | 'ops_admin' | 'trust_safety';
};

const main = async () => {
    const email = process.env.ADMIN_EMAIL?.trim();
    const password = process.env.ADMIN_PASSWORD?.trim();
    const fullName = process.env.ADMIN_FULL_NAME?.trim() || 'Admin User';
    const adminType = resolveAdminType(process.env.ADMIN_TYPE?.trim());

    if (!email) {
        throw new Error('Missing ADMIN_EMAIL env');
    }
    if (!password || password.length < 6) {
        throw new Error('Missing ADMIN_PASSWORD env (min 6 characters)');
    }

    let userRecord;
    try {
        userRecord = await auth.getUserByEmail(email);
        await auth.updateUser(userRecord.uid, {
            password,
            displayName: userRecord.displayName || fullName,
        });
        console.log(`[ADMIN] Existing Firebase user updated: ${email}`);
    } catch {
        userRecord = await auth.createUser({
            email,
            password,
            displayName: fullName,
            emailVerified: true,
        });
        console.log(`[ADMIN] New Firebase user created: ${email}`);
    }

    const now = new Date();
    const userRef = db.collection(USERS_COLLECTION).doc(userRecord.uid);
    const adminRef = db.collection(ADMIN_PROFILES_COLLECTION).doc(userRecord.uid);
    const userDoc = await userRef.get();

    await userRef.set({
        email: userRecord.email || email,
        emailVerified: userRecord.emailVerified,
        fullName: userDoc.exists ? userDoc.data()?.fullName || userRecord.displayName || fullName : userRecord.displayName || fullName,
        primaryRole: 'admin',
        accountStatus: userDoc.exists ? userDoc.data()?.accountStatus || 'active' : 'active',
        createdAt: userDoc.exists ? userDoc.data()?.createdAt || now : now,
        updatedAt: now,
    }, { merge: true });

    await adminRef.set({
        userId: userRecord.uid,
        adminType,
        scopes: adminType === 'super_admin' ? [] : undefined,
        isActive: true,
        mfaRequired: env.ADMIN_REQUIRE_MFA,
        createdAt: now,
        updatedAt: now,
    }, { merge: true });

    console.log(`[ADMIN][OK] ${email} is now ${adminType} (${userRecord.uid})`);
};

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ADMIN][FAIL] ${message}`);
    process.exit(1);
});
