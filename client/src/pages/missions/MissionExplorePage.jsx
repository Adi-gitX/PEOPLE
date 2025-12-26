import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Search, Filter, Cpu, Database, Layout, Shield, CheckCircle2 } from 'lucide-react';

const MISSIONS = [
    {
        id: 1,
        title: "AI Meeting Intelligence",
        initiator: "TechFlow Corp",
        bounty: "$2,500",
        type: "Algorithm",
        complexity: "Hard",
        tags: ["Python", "OpenAI", "Vector DB"],
        description: "Build a system to automatically extract action items and sentiment from Zoom transcripts.",
        slots: { total: 3, filled: 1 }
    },
    {
        id: 2,
        title: "DeFi Dashboard UI",
        initiator: "FinSafe DAO",
        bounty: "$4,000",
        type: "Frontend",
        complexity: "Medium",
        tags: ["React", "Web3", "Tailwind"],
        description: "Create a high-performance, real-time dashboard for tracking liquidity pool metrics.",
        slots: { total: 3, filled: 0 }
    },
    {
        id: 3,
        title: "Legacy SQL Migration",
        initiator: "RetailGiant",
        bounty: "$8,000",
        type: "Backend",
        complexity: "Expert",
        tags: ["PostgreSQL", "Node.js", "Data"],
        description: "Migrate 2TB of customer data from Oracle to Postgres with zero downtime.",
        slots: { total: 5, filled: 2 }
    },
    {
        id: 4,
        title: "Mobile App Testing Suite",
        initiator: "Appify",
        bounty: "$1,200",
        type: "QA",
        complexity: "Easy",
        tags: ["Jest", "Detox", "CI/CD"],
        description: "Develop a comprehensive E2E testing suite for a React Native e-commerce app.",
        slots: { total: 2, filled: 0 }
    },
    {
        id: 5,
        title: "Smart Contract Audit",
        initiator: "SecureChain",
        bounty: "$5,000",
        type: "Security",
        complexity: "Expert",
        tags: ["Solidity", "Security", "Audit"],
        description: "Audit a new staking contract for potential re-entrancy and logic vulnerabilities.",
        slots: { total: 2, filled: 1 }
    },
    {
        id: 6,
        title: "Marketing Site Redesign",
        initiator: "GrowthHacker",
        bounty: "$3,000",
        type: "Design",
        complexity: "Medium",
        tags: ["Figma", "React", "Animation"],
        description: "Redesign the complete marketing funnel with Framer Motion animations.",
        slots: { total: 4, filled: 2 }
    }
];

export default function MissionExplorePage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter mb-4">Explore Missions</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            Join high-impact teams. Solve real problems. Earn trust and reputation.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search missions..."
                                className="w-full bg-white/5 border border-white/10 rounded-md py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                            />
                        </div>
                        <Button variant="outline" className="h-10 border-white/10">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MISSIONS.map((mission) => (
                        <Link key={mission.id} to={`/missions/${mission.id}`} className="group rounded-xl border border-white/10 bg-white/5 p-6 hover:border-white/20 transition-all hover:bg-white/[0.07] cursor-pointer block text-left">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white">
                                        {mission.type === 'Algorithm' && <Cpu className="h-5 w-5" />}
                                        {mission.type === 'Frontend' && <Layout className="h-5 w-5" />}
                                        {mission.type === 'Backend' && <Database className="h-5 w-5" />}
                                        {mission.type === 'QA' && <CheckCircle2 className="h-5 w-5" />}
                                        {mission.type === 'Security' && <Shield className="h-5 w-5" />}
                                        {mission.type === 'Design' && <Layout className="h-5 w-5" />}
                                    </div>
                                    <span className="text-sm font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
                                        {mission.bounty}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{mission.title}</h3>
                                <div className="text-sm text-muted-foreground mb-4">by {mission.initiator}</div>

                                <p className="text-sm text-gray-400 leading-relaxed mb-6 line-clamp-2">
                                    {mission.description}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {mission.tags.map(tag => (
                                        <span key={tag} className="text-xs px-2 py-1 rounded bg-white/5 text-muted-foreground border border-white/5">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            {[...Array(mission.slots.filled)].map((_, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-white/20 border border-black" />
                                            ))}
                                            {[...Array(mission.slots.total - mission.slots.filled)].map((_, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-white/5 border border-black border-dashed flex items-center justify-center text-[8px]">+</div>
                                            ))}
                                        </div>
                                        <span>{mission.slots.filled}/{mission.slots.total} Spots</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded border border-white/10">
                                        {mission.complexity}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
}
