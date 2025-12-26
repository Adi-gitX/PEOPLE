import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Plus, Clock, CheckCircle2, AlertCircle, Users } from 'lucide-react';
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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter mb-2">My Missions</h1>
                    <p className="text-muted-foreground">Manage your active problems and teams.</p>
                </div>
                <Link to="/missions/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Start New Mission
                    </Button>
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Total Bounty Escrowed</div>
                    <div className="text-2xl font-bold text-green-400">$3,700</div>
                </div>
                <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Active Contributors</div>
                    <div className="text-2xl font-bold">1</div>
                </div>
                <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Pending Reviews</div>
                    <div className="text-2xl font-bold text-orange-400">1</div>
                </div>
            </div>

            {/* Missions List */}
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-bold">Active Missions</h3>
                </div>
                <div className="divide-y divide-white/10">
                    {ACTIVE_MISSIONS.map((mission) => (
                        <div key={mission.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                            <div className="min-w-[300px]">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{mission.title}</h4>
                                    {mission.status === 'Draft' ? (
                                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-muted-foreground border border-white/10">Draft</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">Active</span>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-4">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {mission.stage}</span>
                                </div>
                            </div>

                            <div className="text-sm">
                                <div className="text-muted-foreground mb-1">Team</div>
                                <div className="flex -space-x-2">
                                    {mission.team.length > 0 ? mission.team.map((member, i) => (
                                        <div key={i} className={`w-8 h-8 rounded-full border border-black flex items-center justify-center text-xs font-bold ${member.color}`}>
                                            {member.initial}
                                        </div>
                                    )) : <span className="text-muted-foreground">-</span>}
                                </div>
                            </div>

                            <div className="text-sm min-w-[120px]">
                                <div className="text-muted-foreground mb-1">Budget Spent</div>
                                <div className="font-mono">{mission.spent}</div>
                            </div>

                            <div className="text-sm min-w-[150px]">
                                <div className="text-muted-foreground mb-1">Next Action</div>
                                <div className="flex items-center gap-2 text-orange-400">
                                    {mission.status !== 'Draft' && <AlertCircle className="w-4 h-4" />}
                                    <span>{mission.nextAction}</span>
                                </div>
                            </div>

                            <Button variant="outline" size="sm">Manage</Button>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
