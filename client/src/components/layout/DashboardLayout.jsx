import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../layout/Navbar';
import { useAuthStore } from '../../store/useAuthStore';
import { useRoleCapabilities } from '../../hooks/useApi';
import { getDefaultPathForRole } from '../../lib/roleRouting';
import { toast } from 'sonner';
import {
    LayoutDashboard,
    Compass,
    FileText,
    MessageSquare,
    Bell,
    Wallet,
    User,
    Plus,
    Users,
    Menu,
    X,
    Target,
    Briefcase,
    Zap,
    ChevronRight,
    AlertTriangle,
    LifeBuoy,
    UserCog,
    ShieldCheck
} from 'lucide-react';

const contributorNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/contributor' },
    { label: 'Explore Missions', icon: Compass, href: '/dashboard/contributor/explore' },
    { label: 'My Applications', icon: FileText, href: '/applications' },
    { label: 'Messages', icon: MessageSquare, href: '/messages' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Wallet', icon: Wallet, href: '/wallet' },
    { label: 'Profile', icon: User, href: '/dashboard/profile' },
];

const initiatorNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/initiator' },
    { label: 'Create Mission', icon: Plus, href: '/missions/new' },
    { label: 'Explore Talent', icon: Users, href: '/dashboard/initiator/network' },
    { label: 'Messages', icon: MessageSquare, href: '/messages' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Wallet', icon: Wallet, href: '/wallet' },
    { label: 'Profile', icon: User, href: '/dashboard/profile' },
];

const adminNavItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/admin' },
    { label: 'Users', icon: Users, href: '/admin/users', scopes: ['users.read'] },
    { label: 'Missions', icon: Briefcase, href: '/admin/missions', scopes: ['missions.read'] },
    { label: 'Disputes', icon: AlertTriangle, href: '/admin/disputes', scopes: ['disputes.read'] },
    { label: 'Support', icon: LifeBuoy, href: '/admin/support', scopes: ['support.read'] },
    { label: 'Messages', icon: MessageSquare, href: '/admin/messages', scopes: ['messages.read'] },
    { label: 'Withdrawals', icon: Wallet, href: '/admin/withdrawals', scopes: ['withdrawals.read'] },
    { label: 'Payments', icon: Target, href: '/admin/payments', scopes: ['payments.read', 'escrow.read'] },
    { label: 'Audit Log', icon: FileText, href: '/admin/audit', scopes: ['audit.read'] },
    { label: 'Admins', icon: UserCog, href: '/admin/admins', scopes: ['admins.manage'] },
    { label: 'Security', icon: ShieldCheck, href: '/admin/security' },
];

const roleMeta = {
    contributor: { label: 'Contributor', accountLabel: 'Contributor Account' },
    initiator: { label: 'Initiator', accountLabel: 'Initiator Account' },
    admin: { label: 'Admin', accountLabel: 'Admin Account' },
};

const roleOrder = ['contributor', 'initiator', 'admin'];

export function DashboardLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { role, user, adminAccess, switchActiveRole } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
    const [switchingRole, setSwitchingRole] = useState('');
    const roleSwitcherRef = useRef(null);
    const { data: capabilityData } = useRoleCapabilities({
        immediate: Boolean(user?.uid),
        deps: [user?.uid, role],
        resetOnFetch: true,
    });

    // Handle resize to auto-close/open sidebar logic if needed
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(false); // Reset on desktop so it follows sticky logic
            }
        };
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!roleSwitcherOpen) return undefined;

        const handleOutside = (event) => {
            if (!roleSwitcherRef.current) return;
            if (!roleSwitcherRef.current.contains(event.target)) {
                setRoleSwitcherOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [roleSwitcherOpen]);

    const roleCapabilities = useMemo(() => {
        const currentRole = role || 'contributor';
        const fallback = {
            currentRole,
            availableRoles: [currentRole],
            routes: {
                contributor: '/dashboard/contributor',
                initiator: '/dashboard/initiator',
                admin: '/admin',
            },
            disabledRoles: {
                contributor: currentRole === 'contributor' ? null : 'Contributor role is unavailable for this account',
                initiator: currentRole === 'initiator' ? null : 'Initiator role is unavailable for this account',
                admin: currentRole === 'admin' ? null : 'Admin role is unavailable for this account',
            },
        };

        if (!capabilityData) return fallback;

        return {
            currentRole: capabilityData.currentRole || fallback.currentRole,
            availableRoles: Array.isArray(capabilityData.availableRoles) && capabilityData.availableRoles.length > 0
                ? capabilityData.availableRoles
                : fallback.availableRoles,
            routes: capabilityData.routes || fallback.routes,
            disabledRoles: capabilityData.disabledRoles || fallback.disabledRoles,
        };
    }, [capabilityData, role]);

    const activeRole = useMemo(() => {
        const routeRole = location.pathname.startsWith('/admin')
            ? 'admin'
            : location.pathname.startsWith('/dashboard/initiator')
                ? 'initiator'
                : location.pathname.startsWith('/dashboard/contributor')
                    ? 'contributor'
                    : roleCapabilities.currentRole;

        return (roleCapabilities.availableRoles || []).includes(routeRole)
            ? routeRole
            : roleCapabilities.currentRole;
    }, [location.pathname, roleCapabilities]);

    const navItems = (() => {
        if (activeRole !== 'admin') {
            return activeRole === 'initiator' ? initiatorNavItems : contributorNavItems;
        }

        if (!adminAccess || adminAccess.adminType === 'super_admin') {
            return adminNavItems;
        }

        const scopeSet = new Set(adminAccess.scopes || []);
        return adminNavItems.filter((item) => {
            if (!item.scopes || item.scopes.length === 0) return true;
            return item.scopes.every((scope) => scopeSet.has(scope));
        });
    })();

    const visibleRoleOptions = useMemo(() => {
        const availableSet = new Set(roleCapabilities.availableRoles || []);
        return roleOrder.filter((roleKey) => availableSet.has(roleKey));
    }, [roleCapabilities.availableRoles]);

    const isActive = (href) => {
        if (href === '/dashboard/contributor' || href === '/dashboard/initiator' || href === '/admin') {
            return location.pathname === href;
        }
        if (href === '/dashboard/contributor/explore') {
            return location.pathname.startsWith('/dashboard/contributor/explore')
                || location.pathname.startsWith('/dashboard/contributor/missions/')
                || location.pathname.startsWith('/missions/');
        }
        if (href === '/dashboard/initiator/network') {
            return location.pathname.startsWith('/dashboard/initiator/network')
                || location.pathname.startsWith('/network');
        }
        return location.pathname.startsWith(href);
    };

    const handleRoleSwitch = async (targetRole) => {
        const availableRoles = roleCapabilities.availableRoles || [];
        if (!availableRoles.includes(targetRole)) return;
        if (targetRole === activeRole) {
            setRoleSwitcherOpen(false);
            return;
        }

        setSwitchingRole(targetRole);

        try {
            if (targetRole === 'contributor' || targetRole === 'initiator') {
                await switchActiveRole(targetRole);
            }

            const targetPath = roleCapabilities.routes?.[targetRole] || getDefaultPathForRole(targetRole);
            setRoleSwitcherOpen(false);
            setSidebarOpen(false);
            if (targetPath) {
                navigate(targetPath);
            }
        } catch (error) {
            toast.error(error?.message || 'Failed to switch role');
        } finally {
            setSwitchingRole('');
        }
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
                                <div className="text-xs text-neutral-500 capitalize">{activeRole} Account</div>
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
                                        onClick={() => {
                                            setRoleSwitcherOpen(false);
                                            setSidebarOpen(false);
                                        }}
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
                        <div className="relative mb-2" ref={roleSwitcherRef}>
                            <button
                                type="button"
                                onClick={() => setRoleSwitcherOpen((current) => !current)}
                                disabled={Boolean(switchingRole)}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-medium text-neutral-300 border border-white/[0.08] hover:bg-white/[0.03] transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5" />
                                    {roleMeta[activeRole]?.accountLabel || 'Account'}
                                </span>
                                <ChevronRight className={`w-3 h-3 opacity-60 transition-transform ${roleSwitcherOpen ? 'rotate-90' : ''}`} />
                            </button>

                            {roleSwitcherOpen && (
                                <div className="absolute bottom-full mb-2 left-0 right-0 rounded-lg border border-white/[0.08] bg-[#0A0A0A] shadow-lg overflow-hidden z-50">
                                    {visibleRoleOptions.map((roleKey) => {
                                        const isCurrent = activeRole === roleKey;
                                        const isAvailable = (roleCapabilities.availableRoles || []).includes(roleKey);
                                        const disabledReason = roleCapabilities.disabledRoles?.[roleKey];
                                        const isSwitching = switchingRole === roleKey;
                                        return (
                                            <button
                                                key={roleKey}
                                                type="button"
                                                onClick={() => handleRoleSwitch(roleKey)}
                                                disabled={!isAvailable || Boolean(switchingRole)}
                                                title={!isAvailable && disabledReason ? disabledReason : undefined}
                                                className={`w-full text-left px-3 py-2.5 border-b last:border-b-0 border-white/[0.06] transition-colors ${
                                                    isCurrent
                                                        ? 'bg-white text-black'
                                                        : isAvailable
                                                            ? 'text-neutral-200 hover:bg-white/[0.06]'
                                                            : 'text-neutral-600 cursor-not-allowed'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold">
                                                        {isSwitching ? `Switching to ${roleMeta[roleKey].label}...` : roleMeta[roleKey].label}
                                                    </span>
                                                    {isCurrent && <span className="text-[10px] font-medium">Current</span>}
                                                </div>
                                                {!isAvailable && disabledReason && (
                                                    <div className="text-[10px] mt-1 opacity-80">{disabledReason}</div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

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
