import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.js';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: DecodedIdToken;
        }
    }
}

/**
 * Middleware to verify Firebase ID token
 * Adds decoded user to req.user if valid
 */
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
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        });
    }
};

/**
 * Optional auth - continues even without token
 * Sets req.user if token is valid, otherwise undefined
 */
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
            // Token invalid, but we continue anyway
            req.user = undefined;
        }
    }

    next();
};

/**
 * Check if user has specific role
 * Must be used after requireAuth middleware
 */
export const requireRole = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
            return;
        }

        // Get user's role from custom claims or database
        const userRole = req.user.role as string | undefined;

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
