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
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center justify-center">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tighter text-white">Notifications</h1>
                            <p className="text-neutral-400 text-sm mt-1">
                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                            </p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-4 py-2 bg-white/[0.05] text-white border border-white/[0.08] rounded-lg font-medium hover:bg-white/[0.1] transition-colors flex items-center gap-2"
                        >
                            <CheckCheck className="w-4 h-4" /> Mark all read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="text-center py-24 bg-[#0A0A0A] border border-white/[0.08] rounded-xl">
                        <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bell className="w-8 h-8 text-neutral-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No Notifications</h3>
                        <p className="text-neutral-500 max-w-sm mx-auto">You're all caught up! Check back later for updates on your missions and applications.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => {
                            const Icon = TYPE_ICONS[notification.type] || TYPE_ICONS.default;
                            const priorityColor = PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS.basic;

                            return (
                                <div
                                    key={notification.id}
                                    className={`relative group bg-[#0A0A0A] border rounded-xl p-5 hover:bg-white/[0.02] transition-all ${!notification.isRead ? 'border-white/[0.12] shadow-[0_0_20px_rgba(0,0,0,0.2)]' : 'border-white/[0.05]'
                                        }`}
                                >
                                    {/* Unread Indicator Dot */}
                                    {!notification.isRead && (
                                        <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    )}

                                    <div className="flex items-start gap-5">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${!notification.isRead
                                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                : 'bg-white/[0.03] border-white/[0.08] text-neutral-500'
                                            }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>

                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex items-center justify-between gap-4 mb-1.5 pr-6">
                                                <h4 className={`font-semibold tracking-tight ${!notification.isRead ? 'text-white' : 'text-neutral-400'}`}>
                                                    {notification.title}
                                                </h4>
                                            </div>
                                            <p className="text-neutral-400 text-sm leading-relaxed mb-3 pr-8">{notification.message}</p>

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </span>

                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {notification.actionUrl && (
                                                        <Link
                                                            to={notification.actionUrl}
                                                            className="px-3 py-1.5 text-xs bg-white text-black rounded font-bold hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
                                                        >
                                                            {notification.actionLabel || 'View'} <ArrowRight className="w-3 h-3" />
                                                        </Link>
                                                    )}
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(notification.id)}
                                                        className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
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
