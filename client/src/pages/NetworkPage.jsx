import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { useContributors } from '../hooks/useApi';
import { Users, Globe, Shield, Zap, ArrowUpRight, User } from 'lucide-react';
import { toast } from 'sonner';

const MOCK_PEERS = [
    {
        id: 'mock-1',
        fullName: "Alex Rivera",
        headline: "Full Stack Engineer",
        trustScore: 98,
        matchPower: 94,
        skills: [{ skillName: "React" }, { skillName: "Node.js" }, { skillName: "Postgres" }],
        isLookingForWork: true,
    },
    {
        id: 'mock-2',
        fullName: "Sarah Chen",
        headline: "Systems Architect",
        trustScore: 95,
        matchPower: 88,
        skills: [{ skillName: "Go" }, { skillName: "Kubernetes" }, { skillName: "AWS" }],
        isLookingForWork: false,
    },
];

export default function NetworkPage() {
    const { data: apiContributors, loading, error } = useContributors();

    // Use API data if available, fallback to mock
    const contributors = (apiContributors && apiContributors.length > 0) ? apiContributors : MOCK_PEERS;

    const handleConnect = (name) => {
        toast.info(`Connection request sent to ${name}`, {
            description: "They'll be notified of your interest"
        });
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="mb-12 relative">
                    <div className="absolute top-0 right-0 p-32 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
                    <h1 className="text-5xl font-bold tracking-tighter mb-6">The Network</h1>
                    <p className="text-muted-foreground text-xl max-w-2xl leading-relaxed">
                        Connect with the top 1% of builders. Verified trust scores, skills, and reputation.
                        <span className="block mt-2 text-white/60 text-sm">No recruiters. Just peers.</span>
                    </p>
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

                {!loading && contributors.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">No contributors yet</h3>
                        <p className="text-zinc-500">Be the first to join the network!</p>
                    </div>
                )}

                {!loading && contributors.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {contributors.map((peer) => (
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
                                        <div className={`px-2 py-1 rounded text-xs font-mono border ${peer.isLookingForWork
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-white/5 text-muted-foreground border-white/10'
                                            }`}>
                                            {peer.isLookingForWork ? 'Available' : 'Busy'}
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold mb-1 group-hover:text-purple-300 transition-colors">
                                            {peer.fullName || 'Anonymous'}
                                        </h3>
                                        <p className="text-muted-foreground text-sm">{peer.headline || 'Contributor'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                                            <div className="text-xs text-muted-foreground mb-1">Trust Score</div>
                                            <div className="text-lg font-bold text-white flex items-center gap-1">
                                                <Shield className="w-3 h-3 text-purple-400" />
                                                {peer.trustScore || 95}
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                                            <div className="text-xs text-muted-foreground mb-1">Match Power</div>
                                            <div className="text-lg font-bold text-white flex items-center gap-1">
                                                <Zap className="w-3 h-3 text-yellow-400" />
                                                {peer.matchPower || 85}%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {(peer.skills || []).slice(0, 3).map((skill, idx) => (
                                            <span key={idx} className="text-xs px-2 py-1 rounded bg-white/5 text-muted-foreground border border-white/5">
                                                {skill.skillName || skill}
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
                                        onClick={() => handleConnect(peer.fullName || 'this contributor')}
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
                            <div className="text-3xl font-bold text-white mb-1">{contributors.length}+</div>
                            <div className="text-sm text-zinc-500">Active Contributors</div>
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
            <Footer />
        </div>
    );
}
