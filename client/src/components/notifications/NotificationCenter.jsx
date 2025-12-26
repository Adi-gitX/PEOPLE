import { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';

const MOCK_NOTIFICATIONS = [
    {
        id: 1,
        type: 'basic',
        title: 'Potential Match Found',
        message: 'Our algorithm identified "DeFi Dashboard UI" as a 92% match for your profile.',
        time: '5 mins ago',
        read: false,
    },
    {
        id: 2,
        type: 'medium',
        title: 'Client Interest',
        message: 'TechFlow Corp reviewed your profile and shortlisted you for "AI Meeting Intelligence".',
        time: '1 hour ago',
        read: true,
    },
    {
        id: 3,
        type: 'final',
        title: 'FINAL CALL: Action Required',
        message: 'You have been selected for the "Legacy SQL Migration". Confirm within 30 mins to secure the role.',
        time: '2 hours ago',
        read: false,
    }
];

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const unreadCount = notifications.filter(n => !n.read).length;

    const toggleOpen = () => setIsOpen(!isOpen);

    const markAsRead = (id) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    return (
        <div className="relative">
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
                        {notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer ${notification.read ? 'opacity-60' : 'bg-white/[0.02]'}`}
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="flex gap-4">
                                    <div className="mt-1 shrink-0">
                                        {notification.type === 'basic' && <div className="p-2 rounded-full bg-blue-500/10 text-blue-400"><CheckCircle2 className="w-4 h-4" /></div>}
                                        {notification.type === 'medium' && <div className="p-2 rounded-full bg-yellow-500/10 text-yellow-400"><AlertTriangle className="w-4 h-4" /></div>}
                                        {notification.type === 'final' && <div className="p-2 rounded-full bg-red-500/10 text-red-400 animate-pulse"><AlertCircle className="w-4 h-4" /></div>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm font-medium ${notification.type === 'final' && !notification.read ? 'text-red-400' : 'text-white'}`}>
                                                {notification.title}
                                            </h4>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">{notification.time}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                                            {notification.message}
                                        </p>

                                        {!notification.read && (
                                            <div className="flex gap-2 mt-2">
                                                {notification.type === 'final' ? (
                                                    <Button size="sm" className="h-7 text-xs bg-red-500 hover:bg-red-600 text-white w-full">Claim Role</Button>
                                                ) : (
                                                    <Button variant="outline" size="sm" className="h-7 text-xs w-full">View Details</Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 bg-white/5 border-t border-white/10 text-center">
                        <button className="text-xs text-muted-foreground hover:text-white transition-colors">Mark all as read</button>
                    </div>
                </div>
            )}
        </div>
    );
}
