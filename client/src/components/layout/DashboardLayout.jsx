import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from '../layout/Navbar';
import { Footer } from '../layout/Footer';
import { useAuthStore } from '../../store/useAuthStore';
import {
    LayoutDashboard,
    Compass,
    FileText,
    MessageSquare,
    Bell,
    Wallet,
    Settings,
    Plus,
    Users,
    Menu,
    X,
    Target,
    Briefcase,
    Zap,
    LogOut,
    ChevronRight,
    AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/Button';

const contributorNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/contributor' },
    { label: 'Explore Missions', icon: Compass, href: '/explore' },
    { label: 'My Applications', icon: FileText, href: '/applications' },
    { label: 'Messages', icon: MessageSquare, href: '/messages' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Wallet', icon: Wallet, href: '/wallet' },
    { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

const initiatorNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/initiator' },
    { label: 'Create Mission', icon: Plus, href: '/missions/new' },
    { label: 'Explore Talent', icon: Users, href: '/network' },
    { label: 'Messages', icon: MessageSquare, href: '/messages' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Wallet', icon: Wallet, href: '/wallet' },
    { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

const adminNavItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/admin' },
    { label: 'Users', icon: Users, href: '/admin/users' },
    { label: 'Missions', icon: Briefcase, href: '/admin/missions' },
    { label: 'Disputes', icon: AlertTriangle, href: '/admin/disputes' },
];

export function DashboardLayout({ children }) {
    const location = useLocation();
    const { role, user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Handle resize to auto-close/open sidebar logic if needed
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setSidebarOpen(false); // Reset on desktop so it follows sticky logic
            }
        };
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navItems = role === 'admin' ? adminNavItems : role === 'initiator' ? initiatorNavItems : contributorNavItems;

    const isActive = (href) => {
        if (href === '/dashboard/contributor' || href === '/dashboard/initiator' || href === '/admin') {
            return location.pathname === href;
        }
        return location.pathname.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
            <Navbar />

            {/* Mobile Sidebar Toggle - Visible only on mobile */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed bottom-6 right-6 z-50 md:hidden w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
            >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile Sidebar Overlay */}
            <div
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setSidebarOpen(false)}
            />

            <div className="flex pt-16 min-h-screen">
                {/* Sidebar - Desktop: Sticky, Mobile: Fixed Slide-in */}
                <aside
                    className={`
                        fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72
                        bg-[#050505] border-r border-white/[0.08] backdrop-blur-xl
                        transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                        flex flex-col
                    `}
                >
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                        {/* User Profile Snippet */}
                        <div className="flex items-center gap-3 mb-8 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-lg">{user?.displayName?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <div className="font-medium text-sm truncate">{user?.displayName || 'User'}</div>
                                <div className="text-xs text-neutral-500 capitalize">{role} Account</div>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`
                                            group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                                            relative overflow-hidden
                                            ${active
                                                ? 'text-black bg-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                                : 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-4 h-4 transition-colors ${active ? 'text-black' : 'text-neutral-500 group-hover:text-white'}`} />
                                        <span className="relative z-10">{item.label}</span>
                                        {active && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-black"></div>}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-white/[0.08] bg-black/20">
                        {role !== 'admin' && (
                            <Link
                                to={role === 'initiator' ? '/dashboard/contributor' : '/dashboard/initiator'}
                                onClick={() => setSidebarOpen(false)}
                                className="flex items-center justify-between px-4 py-3 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-all border border-transparent hover:border-white/[0.05] mb-2"
                            >
                                <span className="flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5" />
                                    Switch to {role === 'initiator' ? 'Contributor' : 'Initiator'}
                                </span>
                                <ChevronRight className="w-3 h-3 opacity-50" />
                            </Link>
                        )}

                        <div className="text-[10px] text-neutral-600 px-4 text-center font-mono mt-2">
                            PEOPLE OS v1.0.0
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 w-full md:w-[calc(100%-18rem)] overflow-x-hidden">
                    <div className="max-w-[1200px] mx-auto p-6 md:p-10 animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
