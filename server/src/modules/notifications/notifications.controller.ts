import { Request, Response } from 'express';
import * as notificationsService from './notifications.service.js';
import { sendSuccess, sendError, sendNoContent } from '../../utils/response.js';

export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        const { limit, unreadOnly } = req.query;
        const notifications = await notificationsService.getUserNotifications(uid, {
            limit: limit ? parseInt(limit as string, 10) : 20,
            unreadOnly: unreadOnly === 'true',
        });
        sendSuccess(res, { notifications });
    } catch {
        sendError(res, 'Failed to get notifications', 500);
    }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        const count = await notificationsService.getUnreadCount(uid);
        sendSuccess(res, { count });
    } catch {
        sendError(res, 'Failed to get unread count', 500);
    }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        const { id } = req.params;
        await notificationsService.markAsRead(id, uid);
        sendSuccess(res, { message: 'Notification marked as read' });
    } catch (error) {
        if (error instanceof Error && error.message === 'Notification not found') {
            sendError(res, 'Notification not found', 404);
            return;
        }
        if (error instanceof Error && error.message === 'Forbidden') {
            sendError(res, 'Not authorized', 403);
            return;
        }
        sendError(res, 'Failed to mark notification as read', 500);
    }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        await notificationsService.markAllAsRead(uid);
        sendSuccess(res, { message: 'All notifications marked as read' });
    } catch {
        sendError(res, 'Failed to mark all as read', 500);
    }
};

export const archiveNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        const { id } = req.params;
        await notificationsService.archiveNotification(id, uid);
        sendNoContent(res);
    } catch (error) {
        if (error instanceof Error && error.message === 'Notification not found') {
            sendError(res, 'Notification not found', 404);
            return;
        }
        if (error instanceof Error && error.message === 'Forbidden') {
            sendError(res, 'Not authorized', 403);
            return;
        }
        sendError(res, 'Failed to archive notification', 500);
    }
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        const { id } = req.params;
        await notificationsService.deleteNotification(id, uid);
        sendNoContent(res);
    } catch (error) {
        if (error instanceof Error && error.message === 'Notification not found') {
            sendError(res, 'Notification not found', 404);
            return;
        }
        if (error instanceof Error && error.message === 'Forbidden') {
            sendError(res, 'Not authorized', 403);
            return;
        }
        sendError(res, 'Failed to delete notification', 500);
    }
};
