import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { LayoutDashboard, Users, Zap } from 'lucide-react';

export function Navbar() {
    const location = useLocation();
    // Simple check to see if we are in a dashboard route
    const isDashboard = location.pathname.includes('/dashboard');
    const isInitiator = location.pathname.includes('/initiator');
    const isContributor = location.pathname.includes('/contributor');

    return (
        <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/[0.08]">
            <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center">
                {/* Logo - Far Left */}
                <Link to="/" className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity font-display mr-auto">
                    people
                </Link>

                {/* Right Aligned Group */}
                <div className="flex items-center gap-8">
                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
                        <Link to="/explore" className={`hover:text-white transition-colors ${location.pathname.includes('/explore') ? 'text-white' : ''}`}>Missions</Link>
                        <Link to="/network" className={`hover:text-white transition-colors ${location.pathname.includes('/network') ? 'text-white' : ''}`}>Network</Link>
                        <Link to="/integrations" className={`hover:text-white transition-colors ${location.pathname.includes('/integrations') ? 'text-white' : ''}`}>Integrations</Link>
                    </div>

                    <div className="h-4 w-px bg-white/10 hidden md:block"></div>

                    {/* Dashboard Role Switcher & Controls */}
                    <div className="flex items-center gap-4">
                        {isDashboard && (
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

                        <NotificationCenter />

                        {isDashboard ? (
                            <Link to="/contact" className="hidden sm:block">
                                <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white h-8 text-xs">
                                    Help
                                </Button>
                            </Link>
                        ) : (
                            <Link to="/dashboard/contributor">
                                <Button size="sm" className="bg-white text-black hover:bg-neutral-200 font-medium px-4 h-8 rounded text-xs transition-all">
                                    Dashboard
                                </Button>
                            </Link>
                        )}
                        {!isDashboard && (
                            <Link to="/signup">
                                <Button size="sm" className="bg-[#0A0A0A] text-white border border-white/10 hover:bg-white/5 font-medium px-4 h-8 rounded text-xs transition-all ml-2">
                                    Sign Up
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
