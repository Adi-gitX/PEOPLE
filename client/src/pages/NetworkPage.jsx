import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Users, Globe, Shield, Zap, ArrowUpRight } from 'lucide-react';

const PEERS = [
    {
        id: 1,
        name: "Alex Rivera",
        role: "Full Stack Engineer",
        trust: 98,
        match: 94,
        stack: ["React", "Node.js", "Postgres"],
        status: "Available"
    },
    {
        id: 2,
        name: "Sarah Chen",
        role: "Systems Architect",
        trust: 95,
        match: 88,
        stack: ["Go", "Kubernetes", "AWS"],
        status: "Busy"
    },
    {
        id: 3,
        name: "James Wilson",
        role: "AI Researcher",
        trust: 99,
        match: 91,
        stack: ["Python", "PyTorch", "CUDA"],
        status: "Available"
    },
    {
        id: 4,
        name: "Elena Rodriguez",
        role: "Product Designer",
        trust: 92,
        match: 85,
        stack: ["Figma", "Three.js", "WebGL"],
        status: "Available"
    },
    {
        id: 5,
        name: "David Kim",
        role: "Smart Contract Dev",
        trust: 97,
        match: 89,
        stack: ["Solidity", "Rust", "Web3"],
        status: "Busy"
    },
    {
        id: 6,
        name: "Maya Patel",
        role: "Frontend Specialist",
        trust: 94,
        match: 87,
        stack: ["Vue", "Tailwind", "GSAP"],
        status: "Available"
    }
];

export default function NetworkPage() {
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

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {PEERS.map((peer) => (
                        <div key={peer.id} className="group relative rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:bg-white/[0.04] transition-all duration-500">
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div className="p-8 relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-lg font-bold">
                                        {peer.name.charAt(0)}
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-mono border ${peer.status === 'Available' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                                        {peer.status}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold mb-1 group-hover:text-purple-300 transition-colors">{peer.name}</h3>
                                    <p className="text-muted-foreground text-sm">{peer.role}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                                        <div className="text-xs text-muted-foreground mb-1">Trust Score</div>
                                        <div className="text-lg font-bold text-white flex items-center gap-1">
                                            <Shield className="w-3 h-3 text-purple-400" />
                                            {peer.trust}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                                        <div className="text-xs text-muted-foreground mb-1">Match</div>
                                        <div className="text-lg font-bold text-white flex items-center gap-1">
                                            <Zap className="w-3 h-3 text-yellow-400" />
                                            {peer.match}%
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-8">
                                    {peer.stack.map(tech => (
                                        <span key={tech} className="text-xs px-2 py-1 rounded bg-white/5 text-muted-foreground border border-white/5">
                                            {tech}
                                        </span>
                                    ))}
                                </div>

                                <Button className="w-full bg-white text-black hover:bg-white/90 font-semibold group-hover:scale-[1.02] transition-transform">
                                    Connect
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
}
