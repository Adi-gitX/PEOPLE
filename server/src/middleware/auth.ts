import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase.js';
import type { DecodedIdToken } from 'firebase-admin/auth';

type UserRole = 'contributor' | 'initiator' | 'admin';
const USERS_COLLECTION = 'users';

declare global {
    namespace Express {
        interface Request {
            user?: DecodedIdToken;
            userRole?: UserRole;
        }
    }
}

const getUserRole = async (uid: string): Promise<UserRole | undefined> => {
    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (!userDoc.exists) return undefined;
    const role = userDoc.data()?.primaryRole as UserRole | undefined;
    return role;
};

export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'No token provided. Include Authorization: Bearer <token>',
        });
        return;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        req.userRole = await getUserRole(decodedToken.uid);
        next();
    } catch {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        });
    }
};

export const optionalAuth = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        try {
            const decodedToken = await auth.verifyIdToken(token);
            req.user = decodedToken;
        } catch {
            req.user = undefined;
        }
    }

    next();
};

export const requireRole = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
            return;
        }

        let userRole = req.userRole;
        if (!userRole) {
            userRole = await getUserRole(req.user.uid);
            req.userRole = userRole;
        }

        if (!userRole || !roles.includes(userRole)) {
            res.status(403).json({
                error: 'Forbidden',
                message: `Required role: ${roles.join(' or ')}`,
            });
            return;
        }

        next();
    };
};
