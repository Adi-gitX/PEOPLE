import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, User, Settings, MessageSquare, Wallet, Menu, X, Compass, Users, Zap } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, role, logout } = useAuthStore();
    const [showDropdown, setShowDropdown] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isDashboard = location.pathname.includes('/dashboard') ||
        location.pathname.includes('/messages') ||
        location.pathname.includes('/wallet') ||
        location.pathname.includes('/notifications') ||
        location.pathname.includes('/applications') ||
        location.pathname.includes('/admin') ||
        location.pathname.includes('/missions/new');

    const isInitiator = role === 'initiator';
    const isContributor = role === 'contributor';

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const navLinks = [
        { label: 'Missions', href: '/explore', icon: Compass },
        { label: 'Network', href: '/network', icon: Users },
        { label: 'Integrations', href: '/integrations', icon: Zap },
    ];

    return (
        <>
            <nav className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-md border-b border-white/[0.08]">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center">
                    {/* Logo */}
                    <Link to="/" className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity font-display">
                        people
                    </Link>

                    {/* Desktop Navigation - Aligned Right */}
                    <div className="hidden md:flex items-center gap-6 ml-auto mr-8 text-sm font-medium text-neutral-400">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={`hover:text-white transition-colors ${location.pathname.includes(link.href) ? 'text-white' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Dashboard Switcher - Hide in dashboard as it's in sidebar, show only on public pages if auth */}
                        {!isDashboard && isAuthenticated && (
                            <div className="hidden lg:flex items-center bg-[#0A0A0A] rounded-lg p-0.5 border border-white/[0.08]">
                                <Link to="/dashboard/contributor">
                                    <button className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${isContributor ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-white'}`}>
                                        Contributor
                                    </button>
                                </Link>
                                <Link to="/dashboard/initiator">
                                    <button className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${isInitiator ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-white'}`}>
                                        Initiator
                                    </button>
                                </Link>
                            </div>
                        )}

                        {/* Quick Access Icons */}
                        {isAuthenticated && (
                            <div className="hidden sm:flex items-center gap-1">
                                <Link to="/messages" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-neutral-400 hover:text-white">
                                    <MessageSquare className="w-5 h-5" />
                                </Link>
                                <Link to="/wallet" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-neutral-400 hover:text-white">
                                    <Wallet className="w-5 h-5" />
                                </Link>
                                <NotificationCenter />
                            </div>
                        )}

                        {/* User Menu / Auth Buttons */}
                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                                        {user?.photoURL ? (
                                            <img src={user.photoURL} alt="" className="h-8 w-8" />
                                        ) : (
                                            <User className="h-4 w-4 text-zinc-500" />
                                        )}
                                    </div>
                                    <span className="hidden lg:block text-sm text-zinc-300 max-w-[100px] truncate">
                                        {user?.displayName?.split(' ')[0] || 'Account'}
                                    </span>
                                </button>

                                {showDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                                        <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                            <div className="px-4 py-3 border-b border-white/10 bg-black/20">
                                                <p className="text-sm font-medium text-white">{user?.displayName}</p>
                                                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                                            </div>
                                            <div className="py-2">
                                                <Link
                                                    to={`/dashboard/${role || 'contributor'}`}
                                                    onClick={() => setShowDropdown(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
                                                >
                                                    <User className="h-4 w-4" />
                                                    Dashboard
                                                </Link>
                                                <Link
                                                    to="/messages"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 sm:hidden"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                    Messages
                                                </Link>
                                                <Link
                                                    to="/wallet"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 sm:hidden"
                                                >
                                                    <Wallet className="h-4 w-4" />
                                                    Wallet
                                                </Link>
                                                <Link
                                                    to="/dashboard/settings"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
                                                >
                                                    <Settings className="h-4 w-4" />
                                                    Settings
                                                </Link>
                                            </div>
                                            <div className="border-t border-white/10 py-2">
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/5"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-2">
                                <Link to="/login">
                                    <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white h-9 px-4 text-sm">
                                        Log In
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button size="sm" className="bg-white text-black hover:bg-neutral-200 font-medium px-5 h-9 rounded-lg text-sm transition-all">
                                        Sign Up
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button - Hide on dashboard as sidebar takes over */}
                        {!isDashboard && (
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors text-neutral-400"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile Menu - Only for non-dashboard pages */}
            {mobileMenuOpen && !isDashboard && (
                <>
                    <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
                    <div className="fixed top-16 left-0 right-0 bg-black border-b border-white/10 z-40 md:hidden animate-in slide-in-from-top-4">
                        <div className="p-4 space-y-2">
                            {navLinks.map(link => {
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.href}
                                        to={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.includes(link.href)
                                            ? 'bg-white/10 text-white'
                                            : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {link.label}
                                    </Link>
                                );
                            })}

                            {isAuthenticated && (
                                <>
                                    <div className="h-px bg-white/10 my-3" />
                                    <Link
                                        to={`/dashboard/${role || 'contributor'}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
                                    >
                                        <User className="w-5 h-5" />
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/messages"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        Messages
                                    </Link>
                                    <Link
                                        to="/wallet"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
                                    >
                                        <Wallet className="w-5 h-5" />
                                        Wallet
                                    </Link>
                                </>
                            )}

                            {!isAuthenticated && (
                                <>
                                    <div className="h-px bg-white/10 my-3" />
                                    <div className="flex gap-3 px-4 pt-2">
                                        <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                                            <Button variant="outline" className="w-full h-11 border-white/20">
                                                Log In
                                            </Button>
                                        </Link>
                                        <Link to="/signup" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                                            <Button className="w-full h-11 bg-white text-black hover:bg-neutral-200">
                                                Sign Up
                                            </Button>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
