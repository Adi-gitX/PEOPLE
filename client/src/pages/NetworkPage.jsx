import { PublicLayout } from '../components/layout/PublicLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { useUserSearch } from '../hooks/useApi';
import { Users, Shield, Zap, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function NetworkPage() {
    const location = useLocation();
    const { isAuthenticated, role } = useAuthStore();
    const isDashboardRoute = location.pathname.startsWith('/dashboard/');
    const fallbackWorkspaceRole = role === 'initiator' ? 'initiator' : 'contributor';
    const scopedRole = location.pathname.startsWith('/dashboard/initiator')
        ? 'initiator'
        : location.pathname.startsWith('/dashboard/contributor')
            ? 'contributor'
            : fallbackWorkspaceRole;
    const useDashboardLayout = isDashboardRoute || (isAuthenticated && (scopedRole === 'contributor' || scopedRole === 'initiator'));
    const Layout = useDashboardLayout ? DashboardLayout : PublicLayout;

    const [filters, setFilters] = useState({
        q: '',
        role: '',
        availability: '',
        verified: '',
        sort: 'trust',
    });
    const { data: searchData, loading } = useUserSearch(filters);
    const navigate = useNavigate();
    const peers = Array.isArray(searchData?.users) ? searchData.users : [];

    const handleConnect = async (peer) => {
        const recipientId = peer.userId || peer.id;

        if (!isAuthenticated) {
            toast.info('Please log in to start a conversation');
            navigate('/login', { state: { from: { pathname: '/network' } } });
            return;
        }

        try {
            const response = await api.post('/api/v1/conversations/start', { recipientId });
            const conversation = response.data?.conversation;
            toast.success(`Conversation started with ${peer.fullName || 'user'}`);
            if (conversation?.id) {
                navigate(scopedRole === 'initiator' ? '/dashboard/initiator/messages' : '/dashboard/contributor/messages', {
                    state: { conversationId: conversation.id },
                });
            } else {
                navigate(scopedRole === 'initiator' ? '/dashboard/initiator/messages' : '/dashboard/contributor/messages');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to start conversation');
        }
    };

    return (
        <Layout>
            <div className="pt-16 pb-20 px-6 max-w-7xl mx-auto">
                <div className="mb-12 relative">
                    <div className="absolute top-0 right-0 p-32 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
                    <h1 className="text-5xl font-bold tracking-tighter mb-6">The Network</h1>
                    <p className="text-muted-foreground text-xl max-w-2xl leading-relaxed">
                        Connect with the top 1% of builders. Verified trust scores, skills, and reputation.
                        <span className="block mt-2 text-white/60 text-sm">No recruiters. Just peers.</span>
                    </p>

                    <div className="mt-8 grid md:grid-cols-5 gap-3">
                        <div className="md:col-span-2 relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                            <input
                                type="text"
                                value={filters.q}
                                onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
                                placeholder="Search by name, skill, headline"
                                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600"
                            />
                        </div>
                        <select
                            value={filters.role}
                            onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value }))}
                            className="bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
                        >
                            <option value="">All Roles</option>
                            <option value="contributor">Contributors</option>
                            <option value="initiator">Initiators</option>
                        </select>
                        <select
                            value={filters.availability}
                            onChange={(event) => setFilters((prev) => ({ ...prev, availability: event.target.value }))}
                            className="bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
                        >
                            <option value="">Any Availability</option>
                            <option value="true">Available</option>
                            <option value="false">Busy</option>
                        </select>
                        <select
                            value={filters.verified}
                            onChange={(event) => setFilters((prev) => ({ ...prev, verified: event.target.value }))}
                            className="bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
                        >
                            <option value="">Any Verification</option>
                            <option value="true">Verified</option>
                            <option value="false">Unverified</option>
                        </select>
                    </div>
                </div>

                {loading && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 animate-pulse">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-full bg-zinc-800" />
                                    <div className="h-6 w-20 bg-zinc-800 rounded-full" />
                                </div>
                                <div className="h-6 w-32 bg-zinc-800 rounded mb-2" />
                                <div className="h-4 w-40 bg-zinc-800 rounded mb-6" />
                                <div className="flex gap-2 mb-6">
                                    <div className="h-6 w-16 bg-zinc-800 rounded-full" />
                                    <div className="h-6 w-18 bg-zinc-800 rounded-full" />
                                    <div className="h-6 w-14 bg-zinc-800 rounded-full" />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="h-16 bg-zinc-800 rounded-lg" />
                                    <div className="h-16 bg-zinc-800 rounded-lg" />
                                </div>
                                <div className="h-10 w-full bg-zinc-800 rounded-lg" />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && peers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">No users found</h3>
                        <p className="text-zinc-500">Try adjusting your search filters.</p>
                    </div>
                )}

                {!loading && peers.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {peers.map((peer) => (
                            <div key={peer.id} className="group relative rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:bg-white/[0.04] transition-all duration-500">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="p-8 relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-lg font-bold overflow-hidden">
                                            {peer.avatarUrl ? (
                                                <img src={peer.avatarUrl} alt="" className="w-12 h-12" />
                                            ) : (
                                                (peer.fullName || 'A').charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-mono border ${peer.availability
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-white/5 text-muted-foreground border-white/10'
                                            }`}>
                                            {peer.availability ? 'Available' : 'Busy'}
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold mb-1 group-hover:text-purple-300 transition-colors">
                                            {peer.fullName || 'Anonymous'}
                                        </h3>
                                        <p className="text-muted-foreground text-sm">{peer.headline || 'Contributor'}</p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {(peer.rolesAvailable || [peer.roleContext || peer.role || 'contributor']).map((roleName) => (
                                                <span
                                                    key={`${peer.id}-${roleName}`}
                                                    className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-white/10 bg-white/5 text-zinc-400"
                                                >
                                                    {roleName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                                            <div className="text-xs text-muted-foreground mb-1">Trust Score</div>
                                            <div className="text-lg font-bold text-white flex items-center gap-1">
                                                <Shield className="w-3 h-3 text-purple-400" />
                                                {peer.trustScore || 0}
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                                            <div className="text-xs text-muted-foreground mb-1">Match Power</div>
                                            <div className="text-lg font-bold text-white flex items-center gap-1">
                                                <Zap className="w-3 h-3 text-yellow-400" />
                                                {peer.matchPower || 0}%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {(peer.skills || []).slice(0, 3).map((skill, idx) => (
                                            <span key={idx} className="text-xs px-2 py-1 rounded bg-white/5 text-muted-foreground border border-white/5">
                                                {skill}
                                            </span>
                                        ))}
                                        {(peer.skills || []).length > 3 && (
                                            <span className="text-xs px-2 py-1 rounded bg-white/5 text-muted-foreground border border-white/5">
                                                +{(peer.skills || []).length - 3}
                                            </span>
                                        )}
                                    </div>

                                    <Button
                                        className="w-full bg-white text-black hover:bg-white/90 font-semibold group-hover:scale-[1.02] transition-transform"
                                        onClick={() => handleConnect(peer)}
                                    >
                                        Connect
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-16 p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <div className="grid md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">{peers.length}+</div>
                            <div className="text-sm text-zinc-500">Active Users</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">95%</div>
                            <div className="text-sm text-zinc-500">Avg Trust Score</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">24h</div>
                            <div className="text-sm text-zinc-500">Avg Response Time</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">$45k+</div>
                            <div className="text-sm text-zinc-500">Paid to Network</div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
