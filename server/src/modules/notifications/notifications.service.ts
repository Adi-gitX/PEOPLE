import { db } from '../../config/firebase.js';
import type { Notification } from '../../types/firestore.js';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const createNotification = async (
    data: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isArchived'>
): Promise<Notification> => {
    const notification: Omit<Notification, 'id'> = {
        ...data,
        isRead: false,
        isArchived: false,
        createdAt: new Date(),
    };

    const docRef = await db.collection(NOTIFICATIONS_COLLECTION).add(notification);
    return { id: docRef.id, ...notification };
};

export const getUserNotifications = async (
    userId: string,
    options: { limit?: number; unreadOnly?: boolean } = {}
): Promise<Notification[]> => {
    let query: FirebaseFirestore.Query = db
        .collection(NOTIFICATIONS_COLLECTION)
        .where('userId', '==', userId)
        .where('isArchived', '==', false);
    // .orderBy('createdAt', 'desc'); // Removed to avoid missing index error

    if (options.unreadOnly) {
        query = query.where('isRead', '==', false);
    }

    const snapshot = await query.get();
    let notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));

    // Sort in memory
    // Sort in memory
    notifications.sort((a, b) => {
        // Helper to get time in ms from various possible date formats (Date, Timestamp, string)
        const getTime = (date: any) => {
            if (!date) return 0;
            if (date instanceof Date) return date.getTime();
            if (typeof date.toDate === 'function') return date.toDate().getTime(); // Firestore Timestamp
            return new Date(date).getTime();
        };

        return getTime(b.createdAt) - getTime(a.createdAt);
    });

    if (options.limit) {
        notifications = notifications.slice(0, options.limit);
    }

    return notifications;
};

export const getUnreadCount = async (userId: string): Promise<number> => {
    const snapshot = await db
        .collection(NOTIFICATIONS_COLLECTION)
        .where('userId', '==', userId)
        .where('isRead', '==', false)
        .where('isArchived', '==', false)
        .count()
        .get();

    return snapshot.data().count;
};

export const markAsRead = async (notificationId: string): Promise<void> => {
    await db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).update({
        isRead: true,
        readAt: new Date(),
    });
};

export const markAllAsRead = async (userId: string): Promise<void> => {
    const snapshot = await db
        .collection(NOTIFICATIONS_COLLECTION)
        .where('userId', '==', userId)
        .where('isRead', '==', false)
        .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true, readAt: new Date() });
    });
    await batch.commit();
};

export const archiveNotification = async (notificationId: string): Promise<void> => {
    await db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).update({
        isArchived: true,
    });
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
    await db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).delete();
};

// Notification factory functions for common events
export const notifyApplicationReceived = async (
    initiatorId: string,
    missionTitle: string,
    applicantName: string,
    missionId: string
): Promise<Notification> => {
    return createNotification({
        userId: initiatorId,
        type: 'application_received',
        title: 'New Application',
        message: `${applicantName} applied to "${missionTitle}"`,
        priority: 'medium',
        actionUrl: `/missions/${missionId}/applications`,
        actionLabel: 'View Applications',
    });
};

export const notifyApplicationAccepted = async (
    contributorId: string,
    missionTitle: string,
    missionId: string
): Promise<Notification> => {
    return createNotification({
        userId: contributorId,
        type: 'application_accepted',
        title: 'Application Accepted!',
        message: `Your application for "${missionTitle}" has been accepted`,
        priority: 'urgent',
        actionUrl: `/missions/${missionId}`,
        actionLabel: 'View Mission',
    });
};

export const notifyApplicationRejected = async (
    contributorId: string,
    missionTitle: string
): Promise<Notification> => {
    return createNotification({
        userId: contributorId,
        type: 'application_rejected',
        title: 'Application Update',
        message: `Your application for "${missionTitle}" was not selected`,
        priority: 'basic',
    });
};

export const notifyMissionCompleted = async (
    contributorId: string,
    missionTitle: string,
    missionId: string
): Promise<Notification> => {
    return createNotification({
        userId: contributorId,
        type: 'mission_completed',
        title: 'Mission Completed!',
        message: `"${missionTitle}" has been marked as completed`,
        priority: 'urgent',
        actionUrl: `/missions/${missionId}`,
        actionLabel: 'View Mission',
    });
};
