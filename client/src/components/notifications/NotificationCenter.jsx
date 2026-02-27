import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Briefcase, User, DollarSign, MessageCircle, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

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

const POLLING_INTERVAL_MS = 30000;
const MAX_CONSECUTIVE_NETWORK_FAILURES = 3;
const NETWORK_ERROR_REGEX = /(failed to fetch|fetch failed|networkerror|err_connection_refused)/i;

const isNetworkFailure = (error) => {
    if (!(error instanceof Error)) return false;
    return NETWORK_ERROR_REGEX.test(error.message);
};

export function NotificationCenter() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [consecutiveFailures, setConsecutiveFailures] = useState(0);
    const [pollingPaused, setPollingPaused] = useState(false);
    const dropdownRef = useRef(null);
    const hasLoggedNetworkIssueRef = useRef(false);

    const resetNetworkState = useCallback(() => {
        setConsecutiveFailures(0);
        setPollingPaused(false);
        hasLoggedNetworkIssueRef.current = false;
    }, []);

    const handleFetchError = useCallback((context, error) => {
        if (isNetworkFailure(error)) {
            setConsecutiveFailures((previous) => {
                const next = previous + 1;
                if (next >= MAX_CONSECUTIVE_NETWORK_FAILURES) {
                    setPollingPaused(true);
                }
                return next;
            });

            if (!hasLoggedNetworkIssueRef.current) {
                console.warn(`[NotificationCenter] ${context}: backend is currently unreachable.`);
                hasLoggedNetworkIssueRef.current = true;
            }
            return;
        }

        console.error(`[NotificationCenter] ${context}:`, error);
    }, []);

    const fetchNotifications = useCallback(async (force = false) => {
        if (!isAuthenticated) {
            setNotifications([]);
            setLoading(false);
            return;
        }
        if (pollingPaused && !force) {
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/api/v1/notifications');
            setNotifications(response.data?.notifications || []);
            resetNetworkState();
        } catch (error) {
            handleFetchError('Unable to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    }, [handleFetchError, isAuthenticated, pollingPaused, resetNetworkState]);

    const fetchUnreadCount = useCallback(async (force = false) => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            return;
        }
        if (pollingPaused && !force) {
            return;
        }

        try {
            const response = await api.get('/api/v1/notifications/count');
            setUnreadCount(response.data?.count || 0);
            resetNetworkState();
        } catch (error) {
            handleFetchError('Unable to fetch unread count', error);
        }
    }, [handleFetchError, isAuthenticated, pollingPaused, resetNetworkState]);

    useEffect(() => {
        if (!isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            resetNetworkState();
            return undefined;
        }

        setLoading(false);
        void fetchUnreadCount();

        const interval = setInterval(() => {
            void fetchUnreadCount();
        }, POLLING_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [fetchUnreadCount, isAuthenticated, resetNetworkState]);

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

    const handleMarkAsRead = async (id) => {
        try {
            await api.patch(`/api/v1/notifications/${id}/read`);
            setNotifications((previous) => previous.map((notification) => (
                notification.id === id ? { ...notification, isRead: true } : notification
            )));
            setUnreadCount((previous) => Math.max(0, previous - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.post('/api/v1/notifications/read-all');
            setNotifications((previous) => previous.map((notification) => ({ ...notification, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const retryNotifications = () => {
        resetNetworkState();
        void fetchUnreadCount(true);
        if (isOpen) {
            void fetchNotifications(true);
        }
    };

    const toggleOpen = () => {
        const opening = !isOpen;
        setIsOpen(opening);

        if (opening) {
            if (pollingPaused) {
                resetNetworkState();
            }
            void fetchNotifications(true);
            void fetchUnreadCount(true);
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
                        <div className="text-xs text-muted-foreground">
                            {unreadCount} unread
                            {pollingPaused && consecutiveFailures >= MAX_CONSECUTIVE_NETWORK_FAILURES ? ' • offline' : ''}
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {[...Array(3)].map((_, index) => (
                                    <div key={index} className="flex gap-3 animate-pulse">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-3/4 bg-zinc-800 rounded" />
                                            <div className="h-3 w-full bg-zinc-800 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : pollingPaused && notifications.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm mb-3">Notifications are temporarily unavailable.</p>
                                <Button size="sm" variant="outline" onClick={retryNotifications}>
                                    Retry
                                </Button>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.slice(0, 10).map((notification) => {
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
                                                        onClick={(event) => event.stopPropagation()}
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
                        <div className="flex items-center gap-4">
                            {pollingPaused && (
                                <button
                                    type="button"
                                    onClick={retryNotifications}
                                    className="text-xs text-muted-foreground hover:text-white transition-colors"
                                >
                                    Retry
                                </button>
                            )}
                            <Link
                                to="/notifications"
                                className="text-xs text-muted-foreground hover:text-white transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                View all
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
