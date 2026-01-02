import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Briefcase, User, DollarSign, MessageCircle, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { Skeleton } from '../ui/Skeleton';

const TYPE_ICONS = {
    application_received: Briefcase,
    application_accepted: CheckCircle2,
    application_rejected: User,
    mission_completed: Check,
    payment_received: DollarSign,
    message: MessageCircle,
};

const PRIORITY_CONFIG = {
    basic: { bg: 'bg-blue-500/10', text: 'text-blue-400', Icon: CheckCircle2 },
    medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', Icon: AlertTriangle },
    urgent: { bg: 'bg-orange-500/10', text: 'text-orange-400', Icon: AlertTriangle },
    final: { bg: 'bg-red-500/10', text: 'text-red-400', Icon: AlertCircle, animate: true },
};

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/api/v1/notifications');
            setNotifications(response.notifications || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/api/v1/notifications/count');
            setUnreadCount(response.count || 0);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.patch(`/api/v1/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.post('/api/v1/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotifications();
        }
    };

    const getTimeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="font-bold">Notifications</h3>
                        <div className="text-xs text-muted-foreground">{unreadCount} unread</div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex gap-3 animate-pulse">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-3/4 bg-zinc-800 rounded" />
                                            <div className="h-3 w-full bg-zinc-800 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.slice(0, 10).map(notification => {
                                const priorityConfig = PRIORITY_CONFIG[notification.priority] || PRIORITY_CONFIG.basic;
                                const TypeIcon = TYPE_ICONS[notification.type] || Bell;

                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer ${notification.isRead ? 'opacity-60' : 'bg-white/[0.02]'}`}
                                        onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`p-2 rounded-full ${priorityConfig.bg} ${priorityConfig.text} shrink-0 ${priorityConfig.animate ? 'animate-pulse' : ''}`}>
                                                <TypeIcon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-sm font-medium truncate ${notification.priority === 'final' && !notification.isRead ? 'text-red-400' : 'text-white'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                        {getTimeAgo(notification.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                    {notification.message}
                                                </p>

                                                {notification.actionUrl && !notification.isRead && (
                                                    <Link
                                                        to={notification.actionUrl}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-block mt-2"
                                                    >
                                                        <Button variant="outline" size="sm" className="h-7 text-xs">
                                                            {notification.actionLabel || 'View Details'}
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="p-3 bg-white/5 border-t border-white/10 flex justify-between items-center">
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-muted-foreground hover:text-white transition-colors"
                            disabled={unreadCount === 0}
                        >
                            Mark all as read
                        </button>
                        <Link
                            to="/notifications"
                            className="text-xs text-muted-foreground hover:text-white transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            View all
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
