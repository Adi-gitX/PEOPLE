import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { useMissions } from '../../hooks/useApi';
import { Search, Filter, Cpu, Database, Layout, Shield, CheckCircle2, X, Smartphone, Palette, Cloud, Code } from 'lucide-react';



// Mock fallback for when API has no data
const MOCK_MISSIONS = [
    {
        id: 'mock-1',
        title: "AI Meeting Intelligence",
        initiatorName: "TechFlow Corp",
        budgetMax: 2500,
        type: "backend",
        complexity: "hard",
        requiredSkills: ["Python", "OpenAI", "Vector DB"],
        description: "Build a system to automatically extract action items and sentiment from Zoom transcripts.",
    },
    {
        id: 'mock-2',
        title: "DeFi Dashboard UI",
        initiatorName: "FinSafe DAO",
        budgetMax: 4000,
        type: "frontend",
        complexity: "medium",
        requiredSkills: ["React", "Web3", "Tailwind"],
        description: "Create a high-performance, real-time dashboard for tracking liquidity pool metrics.",
    },
];

const TYPE_ICONS = {
    frontend: Layout,
    backend: Database,
    fullstack: Code,
    mobile: Smartphone,
    design: Palette,
    devops: Cloud,
    data: Cpu,
    other: Code,
};

const COMPLEXITY_COLORS = {
    easy: 'text-green-400 border-green-400/20 bg-green-400/10',
    medium: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10',
    hard: 'text-orange-400 border-orange-400/20 bg-orange-400/10',
    expert: 'text-red-400 border-red-400/20 bg-red-400/10',
};

export default function MissionExplorePage() {
    const [filters, setFilters] = useState({
        type: '',
        complexity: '',
        search: '',
    });
    const [showFilters, setShowFilters] = useState(false);

    const { data: apiMissions, loading, error, refetch } = useMissions({
        type: filters.type || undefined,
        complexity: filters.complexity || undefined,
    });


    // Use API data if available, fallback to mock
    const missions = (apiMissions && apiMissions.length > 0) ? apiMissions : MOCK_MISSIONS;

    // Filter by search term locally


    const filteredMissions = missions.filter(m =>
        !filters.search ||
        m.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        m.description?.toLowerCase().includes(filters.search.toLowerCase())
    );

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ type: '', complexity: '', search: '' });
    };

    useEffect(() => {
        refetch();
    }, [filters.type, filters.complexity]);

    return (
        <PublicLayout>
            <div className="pt-16 pb-20 px-6 max-w-7xl mx-auto">

                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter mb-4">Explore Missions</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            Browse active missions. Our algorithm matches you automatically based on your profile strength.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder="Search missions..."
                                className="w-full bg-white/5 border border-white/10 rounded-md py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                            />
                        </div>
                        <Button
                            variant="outline"
                            className="h-10 border-white/10"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                    </div>
                </div>

                {showFilters && (
                    <div className="mb-8 p-6 rounded-xl border border-white/10 bg-white/[0.02] animate-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Filters</h3>
                            <button onClick={clearFilters} className="text-sm text-zinc-500 hover:text-white">
                                Clear all
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-zinc-500 mb-2 block">Type</label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                    className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-sm"
                                >
                                    <option value="">All Types</option>
                                    <option value="frontend">Frontend</option>
                                    <option value="backend">Backend</option>
                                    <option value="fullstack">Full Stack</option>
                                    <option value="mobile">Mobile</option>
                                    <option value="design">Design</option>
                                    <option value="devops">DevOps</option>
                                    <option value="data">Data/ML</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-zinc-500 mb-2 block">Complexity</label>
                                <select
                                    value={filters.complexity}
                                    onChange={(e) => handleFilterChange('complexity', e.target.value)}
                                    className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-sm"
                                >
                                    <option value="">All Complexity</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}


                {(filters.type || filters.complexity) && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {filters.type && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm border border-blue-500/20">
                                Type: {filters.type}
                                <button onClick={() => handleFilterChange('type', '')}>
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {filters.complexity && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm border border-purple-500/20">
                                Complexity: {filters.complexity}
                                <button onClick={() => handleFilterChange('complexity', '')}>
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                    </div>
                )}


                {loading && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-pulse">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 bg-zinc-800 rounded-lg" />
                                    <div className="h-6 w-20 bg-zinc-800 rounded-full" />
                                </div>
                                <div className="h-6 w-3/4 bg-zinc-800 rounded mb-2" />
                                <div className="h-4 w-1/2 bg-zinc-800 rounded mb-4" />
                                <div className="h-4 w-full bg-zinc-800 rounded mb-2" />
                                <div className="h-4 w-4/5 bg-zinc-800 rounded mb-4" />
                                <div className="flex gap-2 mb-4">
                                    <div className="h-6 w-16 bg-zinc-800 rounded-full" />
                                    <div className="h-6 w-20 bg-zinc-800 rounded-full" />
                                    <div className="h-6 w-14 bg-zinc-800 rounded-full" />
                                </div>
                                <div className="h-10 w-full bg-zinc-800 rounded-lg" />
                            </div>
                        ))}
                    </div>
                )}


                {!loading && filteredMissions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">No missions found</h3>
                        <p className="text-zinc-500 mb-6">Try adjusting your filters or check back later</p>
                        <Button onClick={clearFilters}>Clear Filters</Button>
                    </div>
                )}


                {!loading && filteredMissions.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMissions.map((mission) => {
                            const TypeIcon = TYPE_ICONS[mission.type] || Code;
                            const complexityClass = COMPLEXITY_COLORS[mission.complexity] || COMPLEXITY_COLORS.medium;

                            return (
                                <Link
                                    key={mission.id}
                                    to={`/missions/${mission.id}`}
                                    className="group rounded-xl border border-white/10 bg-white/5 p-6 hover:border-white/20 transition-all hover:bg-white/[0.07] cursor-pointer block text-left"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white">
                                                <TypeIcon className="h-5 w-5" />
                                            </div>
                                            <span className="text-sm font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
                                                ${mission.budgetMax?.toLocaleString() || mission.budgetMin?.toLocaleString() || '???'}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                                            {mission.title}
                                        </h3>
                                        <div className="text-sm text-muted-foreground mb-4">
                                            by {mission.initiatorName || 'Anonymous'}
                                        </div>

                                        <p className="text-sm text-gray-400 leading-relaxed mb-6 line-clamp-2">
                                            {mission.description || mission.problemStatement}
                                        </p>

                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {(mission.requiredSkills || []).slice(0, 3).map(tag => (
                                                <span key={tag} className="text-xs px-2 py-1 rounded bg-white/5 text-muted-foreground border border-white/5">
                                                    {typeof tag === 'string' ? tag : tag.name || 'Skill'}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <span className="capitalize">{mission.type}</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded border capitalize ${complexityClass}`}>
                                                {mission.complexity}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
