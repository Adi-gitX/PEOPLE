import { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { sendError } from '../utils/response.js';
import { auth, db } from '../config/firebase.js';
import { env } from '../config/env.js';

const USERS_COLLECTION = 'users';
const ADMIN_PROFILES_COLLECTION = 'adminProfiles';

export type AdminType = 'super_admin' | 'support_admin' | 'ops_admin' | 'trust_safety';

export type AdminScope =
    | 'support.read'
    | 'support.write'
    | 'support.reply'
    | 'users.read'
    | 'users.write'
    | 'missions.read'
    | 'missions.write'
    | 'disputes.read'
    | 'disputes.resolve'
    | 'messages.read'
    | 'messages.moderate'
    | 'withdrawals.read'
    | 'withdrawals.write'
    | 'payments.read'
    | 'escrow.read'
    | 'audit.read'
    | 'admins.manage';

export const ALL_ADMIN_SCOPES: AdminScope[] = [
    'support.read',
    'support.write',
    'support.reply',
    'users.read',
    'users.write',
    'missions.read',
    'missions.write',
    'disputes.read',
    'disputes.resolve',
    'messages.read',
    'messages.moderate',
    'withdrawals.read',
    'withdrawals.write',
    'payments.read',
    'escrow.read',
    'audit.read',
    'admins.manage',
];

const DEFAULT_SCOPES_BY_ADMIN_TYPE: Record<Exclude<AdminType, 'super_admin'>, AdminScope[]> = {
    support_admin: ['support.read', 'support.write', 'support.reply'],
    ops_admin: ['withdrawals.read', 'withdrawals.write', 'payments.read', 'escrow.read', 'users.read'],
    trust_safety: ['messages.read', 'messages.moderate', 'disputes.read', 'disputes.resolve', 'users.read', 'missions.read'],
};

interface AdminProfileDoc {
    userId: string;
    adminType: AdminType;
    scopes?: string[];
    isActive?: boolean;
    mfaRequired?: boolean;
    mfaEnrolledAt?: Date | FirebaseFirestore.Timestamp | null;
    lastMfaResetAt?: Date | FirebaseFirestore.Timestamp | null;
    lastMfaResetBy?: string | null;
}

export interface AdminAccessContext {
    userId: string;
    adminType: AdminType;
    scopes: AdminScope[];
    isActive: boolean;
    mfaRequired: boolean;
    mfaEnrolled: boolean;
    mfaSatisfied: boolean;
    mfaFactor: string | null;
    mfaEnforcementMode: 'warn' | 'enforce';
    mfaEnrolledAt?: Date | FirebaseFirestore.Timestamp | null;
    lastMfaResetAt?: Date | FirebaseFirestore.Timestamp | null;
    lastMfaResetBy?: string | null;
}

declare global {
    namespace Express {
        interface Request {
            adminAccess?: AdminAccessContext;
        }
    }
}

const normalizeScopes = (rawScopes: string[] | undefined): AdminScope[] => {
    if (!Array.isArray(rawScopes) || rawScopes.length === 0) return [];
    const whitelist = new Set<AdminScope>(ALL_ADMIN_SCOPES);
    const filtered = rawScopes.filter((scope): scope is AdminScope => whitelist.has(scope as AdminScope));
    return Array.from(new Set(filtered));
};

const getTokenSecondFactor = (decodedToken: DecodedIdToken | undefined): string | null => {
    if (!decodedToken) return null;
    const firebaseClaims = decodedToken.firebase as Record<string, unknown> | undefined;
    const secondFactor = firebaseClaims?.sign_in_second_factor;
    return typeof secondFactor === 'string' && secondFactor.trim().length > 0
        ? secondFactor
        : null;
};

const hasScope = (access: AdminAccessContext, scope: AdminScope): boolean => {
    if (access.adminType === 'super_admin') return true;
    return access.scopes.includes(scope);
};

const logScopeDenied = (req: Request, requiredScopes: AdminScope[]): void => {
    const payload = {
        event: 'admin_scope_denied',
        userId: req.user?.uid || null,
        adminType: req.adminAccess?.adminType || null,
        requiredScopes,
        actualScopes: req.adminAccess?.scopes || [],
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
    };
    console.warn(JSON.stringify(payload));
};

const logMfaDenied = (req: Request): void => {
    const payload = {
        event: 'admin_mfa_denied',
        userId: req.user?.uid || null,
        adminType: req.adminAccess?.adminType || null,
        mfaRequired: req.adminAccess?.mfaRequired || false,
        mfaEnrolled: req.adminAccess?.mfaEnrolled || false,
        mfaSatisfied: req.adminAccess?.mfaSatisfied || false,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
    };
    console.warn(JSON.stringify(payload));
};

export const resolveAdminAccess = async (
    uid: string,
    decodedToken?: DecodedIdToken
): Promise<AdminAccessContext | null> => {
    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (!userDoc.exists) return null;

    const role = userDoc.data()?.primaryRole;
    if (role !== 'admin') return null;

    const profileDoc = await db.collection(ADMIN_PROFILES_COLLECTION).doc(uid).get();
    if (!profileDoc.exists) {
        if (env.NODE_ENV === 'production') {
            return null;
        }

        const fallbackFactor = getTokenSecondFactor(decodedToken);
        let fallbackMfaEnrolled = false;
        try {
            const userRecord = await auth.getUser(uid);
            fallbackMfaEnrolled = (userRecord.multiFactor?.enrolledFactors?.length || 0) > 0;
        } catch {
            fallbackMfaEnrolled = false;
        }

        return {
            userId: uid,
            adminType: 'super_admin',
            scopes: ALL_ADMIN_SCOPES,
            isActive: true,
            mfaRequired: env.ADMIN_REQUIRE_MFA,
            mfaEnrolled: fallbackMfaEnrolled,
            mfaSatisfied: Boolean(fallbackFactor),
            mfaFactor: fallbackFactor,
            mfaEnforcementMode: env.ADMIN_MFA_ENFORCEMENT_MODE,
            mfaEnrolledAt: null,
            lastMfaResetAt: null,
            lastMfaResetBy: null,
        };
    }

    const profileData = profileDoc.data() as AdminProfileDoc;
    const adminType: AdminType = profileData.adminType || 'super_admin';
    const isActive = profileData.isActive !== false;

    let scopes: AdminScope[];
    if (adminType === 'super_admin') {
        scopes = ALL_ADMIN_SCOPES;
    } else {
        const explicitScopes = normalizeScopes(profileData.scopes);
        const defaultScopes = DEFAULT_SCOPES_BY_ADMIN_TYPE[adminType];
        scopes = explicitScopes.length > 0 ? explicitScopes : defaultScopes;
    }

    const tokenSecondFactor = getTokenSecondFactor(decodedToken);

    let mfaEnrolled = false;
    try {
        const userRecord = await auth.getUser(uid);
        mfaEnrolled = (userRecord.multiFactor?.enrolledFactors?.length || 0) > 0;
    } catch {
        mfaEnrolled = false;
    }

    return {
        userId: uid,
        adminType,
        scopes,
        isActive,
        mfaRequired: profileData.mfaRequired ?? env.ADMIN_REQUIRE_MFA,
        mfaEnrolled,
        mfaSatisfied: Boolean(tokenSecondFactor),
        mfaFactor: tokenSecondFactor,
        mfaEnforcementMode: env.ADMIN_MFA_ENFORCEMENT_MODE,
        mfaEnrolledAt: profileData.mfaEnrolledAt ?? null,
        lastMfaResetAt: profileData.lastMfaResetAt ?? null,
        lastMfaResetBy: profileData.lastMfaResetBy ?? null,
    };
};

export const requireAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'Authentication required', 401);
            return;
        }

        const adminAccess = await resolveAdminAccess(uid, req.user);
        if (!adminAccess) {
            sendError(res, 'Admin access required', 403);
            return;
        }

        if (!adminAccess.isActive) {
            sendError(res, 'Admin account is inactive', 403);
            return;
        }

        req.userRole = 'admin';
        req.adminAccess = adminAccess;
        next();
    } catch {
        sendError(res, 'Authorization failed', 500);
    }
};

export const requireSuperAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'Authentication required', 401);
            return;
        }

        const adminAccess = req.adminAccess || await resolveAdminAccess(uid, req.user);
        if (!adminAccess) {
            sendError(res, 'Admin access required', 403);
            return;
        }

        if (adminAccess.adminType !== 'super_admin') {
            sendError(res, 'Super admin access required', 403);
            return;
        }

        req.adminAccess = adminAccess;
        next();
    } catch {
        sendError(res, 'Authorization failed', 500);
    }
};

export const requireAdminScope = (requiredScopes: AdminScope[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.user?.uid;
            if (!uid) {
                sendError(res, 'Authentication required', 401);
                return;
            }

            const adminAccess = req.adminAccess || await resolveAdminAccess(uid, req.user);
            if (!adminAccess) {
                sendError(res, 'Admin access required', 403);
                return;
            }

            if (!adminAccess.isActive) {
                sendError(res, 'Admin account is inactive', 403);
                return;
            }

            const allowed = requiredScopes.every((scope) => hasScope(adminAccess, scope));
            if (!allowed) {
                req.adminAccess = adminAccess;
                logScopeDenied(req, requiredScopes);
                sendError(res, 'Insufficient admin scope', 403);
                return;
            }

            req.adminAccess = adminAccess;
            next();
        } catch {
            sendError(res, 'Authorization failed', 500);
        }
    };
};

export const requireAdminMfa = (options?: { allowPaths?: string[] }) => {
    const allowPaths = options?.allowPaths || [];

    return (req: Request, res: Response, next: NextFunction): void => {
        const adminAccess = req.adminAccess;
        if (!adminAccess) {
            sendError(res, 'Admin access required', 403);
            return;
        }

        const isAllowedPath = allowPaths.some((pathPrefix) =>
            req.path === pathPrefix || req.path.startsWith(`${pathPrefix}/`)
        );
        if (isAllowedPath) {
            next();
            return;
        }

        if (!adminAccess.mfaRequired) {
            next();
            return;
        }

        if (adminAccess.mfaEnforcementMode === 'warn') {
            if (!adminAccess.mfaSatisfied) {
                console.warn(JSON.stringify({
                    event: 'admin_mfa_warn',
                    userId: req.user?.uid || null,
                    path: req.path,
                    method: req.method,
                    timestamp: new Date().toISOString(),
                }));
            }
            next();
            return;
        }

        if (!adminAccess.mfaSatisfied) {
            logMfaDenied(req);
            sendError(res, 'Admin MFA verification required', 403);
            return;
        }

        next();
    };
};
