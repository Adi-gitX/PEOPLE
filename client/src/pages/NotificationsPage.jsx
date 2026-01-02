import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { api } from '../lib/api';
import { Bell, Check, CheckCheck, Trash2, ArrowRight, Briefcase, User, DollarSign, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonNotificationItem } from '../components/ui/Skeleton';

const TYPE_ICONS = {
    application_received: Briefcase,
    application_accepted: Check,
    application_rejected: User,
    mission_completed: CheckCheck,
    payment_received: DollarSign,
    message: MessageCircle,
    default: Bell,
};

const PRIORITY_COLORS = {
    basic: 'border-zinc-700',
    medium: 'border-blue-500/50',
    urgent: 'border-yellow-500/50',
    final: 'border-red-500/50',
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/api/v1/notifications');
            setNotifications(response.notifications || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.patch(`/api/v1/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.post('/api/v1/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/v1/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-6 md:p-8 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                                <Bell className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Notifications</h1>
                                <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse mt-1" />
                            </div>
                        </div>
                        <div className="h-10 w-32 bg-zinc-800 rounded animate-pulse" />
                    </div>

                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <SkeletonNotificationItem key={i} />
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Notifications</h1>
                            <p className="text-zinc-400 text-sm">
                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                            </p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-4 py-2 bg-zinc-800 text-white rounded font-medium hover:bg-zinc-700 transition-colors flex items-center gap-2"
                        >
                            <CheckCheck className="w-4 h-4" /> Mark all read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No Notifications</h3>
                        <p className="text-zinc-400">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => {
                            const Icon = TYPE_ICONS[notification.type] || TYPE_ICONS.default;
                            const priorityColor = PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS.basic;

                            return (
                                <div
                                    key={notification.id}
                                    className={`bg-zinc-900 border-l-4 ${priorityColor} rounded-lg p-4 ${!notification.isRead ? 'bg-zinc-900' : 'bg-zinc-900/50'}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-white/10' : 'bg-zinc-800'}`}>
                                            <Icon className={`w-5 h-5 ${!notification.isRead ? 'text-white' : 'text-zinc-400'}`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className={`font-medium ${!notification.isRead ? 'text-white' : 'text-zinc-400'}`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                                )}
                                            </div>
                                            <p className="text-zinc-400 text-sm">{notification.message}</p>
                                            <p className="text-zinc-600 text-xs mt-1">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {notification.actionUrl && (
                                                <Link
                                                    to={notification.actionUrl}
                                                    className="px-3 py-1.5 text-sm bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors flex items-center gap-1"
                                                >
                                                    {notification.actionLabel || 'View'} <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            )}
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(notification.id)}
                                                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
