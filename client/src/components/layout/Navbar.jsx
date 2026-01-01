import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, User, Settings } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, role, logout } = useAuthStore();
    const [showDropdown, setShowDropdown] = useState(false);

    const isDashboard = location.pathname.includes('/dashboard');
    const isInitiator = role === 'initiator';
    const isContributor = role === 'contributor';

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/[0.08]">
            <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center">
                <Link to="/" className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity font-display mr-auto">
                    people
                </Link>

                <div className="flex items-center gap-8">
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
                        <Link to="/explore" className={`hover:text-white transition-colors ${location.pathname.includes('/explore') ? 'text-white' : ''}`}>Missions</Link>
                        <Link to="/network" className={`hover:text-white transition-colors ${location.pathname.includes('/network') ? 'text-white' : ''}`}>Network</Link>
                        <Link to="/integrations" className={`hover:text-white transition-colors ${location.pathname.includes('/integrations') ? 'text-white' : ''}`}>Integrations</Link>
                    </div>

                    <div className="h-4 w-px bg-white/10 hidden md:block"></div>

                    <div className="flex items-center gap-4">
                        {isDashboard && isAuthenticated && (
                            <div className="hidden md:flex items-center bg-[#0A0A0A] rounded-lg p-0.5 border border-white/[0.08]">
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

                        {isAuthenticated && <NotificationCenter />}

                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                                        {user?.photoURL ? (
                                            <img src={user.photoURL} alt="" className="h-7 w-7" />
                                        ) : (
                                            <User className="h-4 w-4 text-zinc-500" />
                                        )}
                                    </div>
                                    <span className="hidden md:block text-sm text-zinc-300 max-w-[100px] truncate">
                                        {user?.displayName?.split(' ')[0] || 'Account'}
                                    </span>
                                </button>

                                {showDropdown && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowDropdown(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                            <div className="px-4 py-3 border-b border-white/10">
                                                <p className="text-sm font-medium text-white">{user?.displayName}</p>
                                                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                                            </div>
                                            <div className="py-1">
                                                <Link
                                                    to={`/dashboard/${role || 'contributor'}`}
                                                    onClick={() => setShowDropdown(false)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
                                                >
                                                    <User className="h-4 w-4" />
                                                    Dashboard
                                                </Link>
                                                <Link
                                                    to="/dashboard/settings"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
                                                >
                                                    <Settings className="h-4 w-4" />
                                                    Settings
                                                </Link>
                                            </div>
                                            <div className="border-t border-white/10 py-1">
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-white/5"
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
                            <div className="flex items-center gap-2">
                                <Link to="/login">
                                    <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white h-8 text-xs">
                                        Log In
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button size="sm" className="bg-white text-black hover:bg-neutral-200 font-medium px-4 h-8 rounded text-xs transition-all">
                                        Sign Up
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
