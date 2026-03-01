import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { db } from '../config/firebase.js';

const USERS_COLLECTION = 'users';

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

        let role = req.userRole;
        if (!role) {
            const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
            if (!userDoc.exists) {
                sendError(res, 'User not found', 404);
                return;
            }
            role = userDoc.data()?.primaryRole;
            req.userRole = role;
        }

        if (role !== 'admin') {
            sendError(res, 'Admin access required', 403);
            return;
        }

        next();
    } catch {
        sendError(res, 'Authorization failed', 500);
    }
};
