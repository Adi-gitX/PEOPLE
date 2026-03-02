import { auth, db } from '../config/firebase.js';
import { env } from '../config/env.js';

const USERS_COLLECTION = 'users';
const ADMIN_PROFILES_COLLECTION = 'adminProfiles';

const allowedTypes = new Set(['super_admin', 'support_admin', 'ops_admin', 'trust_safety']);

const main = async () => {
    const email = process.env.ADMIN_EMAIL?.trim();
    const adminTypeInput = process.env.ADMIN_TYPE?.trim() || 'super_admin';
    const adminType = allowedTypes.has(adminTypeInput) ? adminTypeInput : 'super_admin';

    if (!email) {
        throw new Error('Missing ADMIN_EMAIL env. Example: ADMIN_EMAIL=user@example.com npm run admin:promote');
    }

    const authUser = await auth.getUserByEmail(email);
    const now = new Date();
    const userRef = db.collection(USERS_COLLECTION).doc(authUser.uid);
    const adminRef = db.collection(ADMIN_PROFILES_COLLECTION).doc(authUser.uid);
    const userDoc = await userRef.get();

    await userRef.set({
        email: authUser.email || email,
        emailVerified: authUser.emailVerified,
        fullName: userDoc.exists ? userDoc.data()?.fullName || authUser.displayName || 'Admin User' : authUser.displayName || 'Admin User',
        primaryRole: 'admin',
        accountStatus: userDoc.exists ? userDoc.data()?.accountStatus || 'active' : 'active',
        createdAt: userDoc.exists ? userDoc.data()?.createdAt || now : now,
        updatedAt: now,
    }, { merge: true });

    await adminRef.set({
        userId: authUser.uid,
        adminType,
        scopes: adminType === 'super_admin' ? [] : undefined,
        isActive: true,
        mfaRequired: env.ADMIN_REQUIRE_MFA,
        createdAt: now,
        updatedAt: now,
    }, { merge: true });

    console.log(`[ADMIN][OK] ${email} promoted to ${adminType} (${authUser.uid})`);
};

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ADMIN][FAIL] ${message}`);
    process.exit(1);
});
