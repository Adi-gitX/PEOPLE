import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Hook for real-time notification subscriptions using Firestore
 * Falls back gracefully if Firestore is unavailable
 */
export const useRealtimeNotifications = (maxCount = 10) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user?.uid) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        let unsubscribe = null;

        try {
            // Query notifications for current user
            const notificationsRef = collection(firestore, 'notifications');
            const q = query(
                notificationsRef,
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(maxCount)
            );

            // Subscribe to real-time updates
            unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const notificationsList = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        // Convert Firestore timestamp to Date
                        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                    }));

                    setNotifications(notificationsList);
                    setUnreadCount(notificationsList.filter(n => !n.isRead).length);
                    setLoading(false);
                    setError(null);
                },
                (err) => {
                    console.error('Firestore notifications subscription error:', err);
                    setError(err.message);
                    setLoading(false);
                }
            );
        } catch (err) {
            console.error('Failed to subscribe to notifications:', err);
            setError(err.message);
            setLoading(false);
        }

        // Cleanup subscription on unmount
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user?.uid, maxCount]);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        isRealtime: true,
    };
};

/**
 * Hook for real-time message subscriptions in a conversation
 */
export const useRealtimeMessages = (conversationId) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        let unsubscribe = null;

        try {
            const messagesRef = collection(
                firestore,
                'conversations',
                conversationId,
                'messages'
            );
            const q = query(
                messagesRef,
                orderBy('createdAt', 'asc'),
                limit(100)
            );

            unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const messagesList = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                    }));

                    setMessages(messagesList);
                    setLoading(false);
                    setError(null);
                },
                (err) => {
                    console.error('Messages subscription error:', err);
                    setError(err.message);
                    setLoading(false);
                }
            );
        } catch (err) {
            console.error('Failed to subscribe to messages:', err);
            setError(err.message);
            setLoading(false);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [conversationId]);

    return { messages, loading, error, isRealtime: true };
};

export default useRealtimeNotifications;
