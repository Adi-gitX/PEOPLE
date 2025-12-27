import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Plus, Clock, CheckCircle2, AlertCircle, Users, Wallet, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const ACTIVE_MISSIONS = [
    {
        id: 1,
        title: "AI Meeting Intelligence",
        status: "In Progress",
        stage: "Week 2 - MVP Implementation",
        spent: "$500 / $2,500",
        team: [
            { initial: "SC", color: "bg-blue-500" },
            { initial: "?", color: "bg-white/10" }
        ],
        nextAction: "Review Architecture Doc",
        deadline: "2 days left"
    },
    {
        id: "draft-1",
        title: "Mobile App Testing Suite",
        status: "Draft",
        stage: "Planning",
        spent: "$0 / $1,200",
        team: [],
        nextAction: "Publish Mission",
        deadline: "-"
    }
];

export default function InitiatorDashboard() {
    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter mb-2 text-white">Mission Control</h1>
                    <p className="text-lg text-muted-foreground">Orchestrate your active problems and teams.</p>
                </div>
                <Link to="/missions/new">
                    <Button className="bg-white text-black hover:bg-white/90 h-12 px-6 rounded-lg font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        <Plus className="w-5 h-5 mr-2" />
                        Start New Mission
                    </Button>
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A] relative overflow-hidden group hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="text-sm text-neutral-400 font-medium font-mono uppercase tracking-wider">Total Escrowed</div>
                        <Wallet className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-4xl font-bold text-white tracking-tighter mb-2 relative z-10">$3,700</div>
                    <div className="text-xs text-green-400 font-mono relative z-10 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        +12% vs last month
                    </div>
                </div>

                <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A] relative overflow-hidden group hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="text-sm text-neutral-400 font-medium font-mono uppercase tracking-wider">Active Contributors</div>
                        <Users className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-4xl font-bold text-white tracking-tighter mb-2 relative z-10">1</div>
                    <div className="text-xs text-blue-400 font-mono relative z-10 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        2 Pending Review
                    </div>
                </div>

                <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A] relative overflow-hidden group hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="text-sm text-neutral-400 font-medium font-mono uppercase tracking-wider">Action Items</div>
                        <Target className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-4xl font-bold text-white tracking-tighter mb-2 relative z-10">3</div>
                    <div className="text-xs text-orange-400 font-mono relative z-10 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        Urgent Attention Req
                    </div>
                </div>
            </div>

            {/* Missions List */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0A] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-black/20">
                    <h3 className="font-bold tracking-tight text-white text-lg">Active Missions</h3>
                </div>
                <div className="divide-y divide-white/5">
                    {ACTIVE_MISSIONS.map((mission) => (
                        <div key={mission.id} className="p-8 hover:bg-white/[0.04] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between group gap-6 md:gap-0">
                            <div className="min-w-[300px]">
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-bold text-xl text-white group-hover:text-blue-400 transition-colors tracking-tight">{mission.title}</h4>
                                    {mission.status === 'Draft' ? (
                                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-xs font-semibold text-muted-foreground border border-white/10">Draft</span>
                                    ) : (
                                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">Active</span>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-4">
                                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-white/40" /> {mission.stage}</span>
                                </div>
                            </div>

                            <div className="text-sm">
                                <div className="text-muted-foreground/60 mb-1.5 text-xs font-medium uppercase tracking-wider">Team</div>
                                <div className="flex -space-x-2">
                                    {mission.team.length > 0 ? mission.team.map((member, i) => (
                                        <div key={i} className={`w-9 h-9 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-xs font-bold shadow-lg ${member.color}`}>
                                            {member.initial}
                                        </div>
                                    )) : <span className="text-muted-foreground text-xs italic">Unassigned</span>}
                                </div>
                            </div>

                            <div className="text-sm min-w-[120px]">
                                <div className="text-muted-foreground/60 mb-1.5 text-xs font-medium uppercase tracking-wider">Budget Spent</div>
                                <div className="font-mono text-white font-medium">{mission.spent}</div>
                            </div>

                            <div className="text-sm min-w-[200px]">
                                <div className="text-muted-foreground/60 mb-1.5 text-xs font-medium uppercase tracking-wider">Next Action</div>
                                <div className="flex items-center gap-2 text-orange-400 font-medium bg-orange-400/10 px-3 py-1.5 rounded-lg border border-orange-400/20 w-fit">
                                    {mission.status !== 'Draft' && <AlertCircle className="w-4 h-4" />}
                                    <span>{mission.nextAction}</span>
                                </div>
                            </div>

                            <Button variant="outline" size="sm" className="hidden md:flex border-white/10 hover:bg-white/10 h-9">Manage</Button>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
