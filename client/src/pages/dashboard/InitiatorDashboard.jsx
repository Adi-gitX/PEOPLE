import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Plus, Clock, CheckCircle2, AlertCircle, Users, Wallet, Target, Loader2, MessageSquare, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useMyMissions } from '../../hooks/useApi';

export default function InitiatorDashboard() {
    const { user } = useAuthStore();
    const { data: missions, loading, error } = useMyMissions();


    const activeMissions = missions?.filter(m => m.status === 'in_progress') || [];
    const draftMissions = missions?.filter(m => m.status === 'draft') || [];
    const allMissions = missions || [];

    const totalEscrowed = allMissions.reduce((sum, m) => sum + (m.budgetMax || 0), 0);
    const totalContributors = allMissions.reduce((sum, m) => sum + (m.assignments?.length || 0), 0);

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter mb-2 text-white">
                        Welcome, {user?.displayName?.split(' ')[0] || 'Initiator'}
                    </h1>
                    <p className="text-lg text-muted-foreground">Orchestrate your active problems and teams.</p>
                </div>
                <Link to="/missions/new">
                    <Button className="bg-white text-black hover:bg-white/90 h-12 px-6 rounded-lg font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        <Plus className="w-5 h-5 mr-2" />
                        Start New Mission
                    </Button>
                </Link>
            </div>


            <div className="grid md:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A] relative overflow-hidden group hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="text-sm text-neutral-400 font-medium font-mono uppercase tracking-wider">Total Budget</div>
                        <Wallet className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-4xl font-bold text-white tracking-tighter mb-2 relative z-10">
                        ${totalEscrowed.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-400 font-mono relative z-10 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {allMissions.length} mission{allMissions.length !== 1 ? 's' : ''}
                    </div>
                </div>

                <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A] relative overflow-hidden group hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="text-sm text-neutral-400 font-medium font-mono uppercase tracking-wider">Active Contributors</div>
                        <Users className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-4xl font-bold text-white tracking-tighter mb-2 relative z-10">{totalContributors}</div>
                    <div className="text-xs text-blue-400 font-mono relative z-10 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {activeMissions.length} Active Mission{activeMissions.length !== 1 ? 's' : ''}
                    </div>
                </div>

                <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A] relative overflow-hidden group hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="text-sm text-neutral-400 font-medium font-mono uppercase tracking-wider">Draft Missions</div>
                        <Target className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-4xl font-bold text-white tracking-tighter mb-2 relative z-10">{draftMissions.length}</div>
                    <div className="text-xs text-orange-400 font-mono relative z-10 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        Ready to publish
                    </div>
                </div>
            </div>


            <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0A] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-black/20">
                    <h3 className="font-bold tracking-tight text-white text-lg">Your Missions</h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                    </div>
                ) : allMissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <Target className="w-8 h-8 text-zinc-500" />
                        </div>
                        <h4 className="text-lg font-medium text-white mb-2">No missions yet</h4>
                        <p className="text-zinc-500 mb-6">Create your first mission to get started</p>
                        <Link to="/missions/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Mission
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {allMissions.map((mission) => (
                            <div key={mission.id} className="p-8 hover:bg-white/[0.04] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between group gap-6 md:gap-0">
                                <div className="min-w-[300px]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-bold text-xl text-white group-hover:text-blue-400 transition-colors tracking-tight">{mission.title}</h4>
                                        {mission.status === 'draft' ? (
                                            <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-xs font-semibold text-muted-foreground border border-white/10">Draft</span>
                                        ) : mission.status === 'open' ? (
                                            <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20">Open</span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">Active</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-white/40" />
                                            {mission.type} • {mission.complexity}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-sm min-w-[120px]">
                                    <div className="text-muted-foreground/60 mb-1.5 text-xs font-medium uppercase tracking-wider">Budget</div>
                                    <div className="font-mono text-white font-medium">${mission.budgetMin} - ${mission.budgetMax}</div>
                                </div>

                                <div className="text-sm min-w-[150px]">
                                    <div className="text-muted-foreground/60 mb-1.5 text-xs font-medium uppercase tracking-wider">Duration</div>
                                    <div className="text-white">{mission.estimatedDurationDays} days</div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link to={`/missions/${mission.id}/applications`}>
                                        <Button variant="outline" size="sm" className="hidden md:flex border-white/10 hover:bg-white/10 h-9">
                                            Applications
                                        </Button>
                                    </Link>
                                    <Link to={`/missions/${mission.id}`}>
                                        <Button variant="outline" size="sm" className="hidden md:flex border-white/10 hover:bg-white/10 h-9">
                                            View
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>

            {/* Quick Actions */}
            <div className="mt-10">
                <h3 className="text-lg font-bold text-white mb-4 tracking-tight">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/missions/new" className="p-4 rounded-xl border border-white/[0.08] bg-[#0A0A0A] hover:border-white/20 transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                            <Plus className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="font-medium text-white text-sm">Create Mission</div>
                        <div className="text-xs text-neutral-500 mt-1">Post a new project</div>
                    </Link>
                    <Link to="/network" className="p-4 rounded-xl border border-white/[0.08] bg-[#0A0A0A] hover:border-white/20 transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                            <UserPlus className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="font-medium text-white text-sm">Find Talent</div>
                        <div className="text-xs text-neutral-500 mt-1">Browse contributors</div>
                    </Link>
                    <Link to="/messages" className="p-4 rounded-xl border border-white/[0.08] bg-[#0A0A0A] hover:border-white/20 transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3 group-hover:bg-green-500/20 transition-colors">
                            <MessageSquare className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="font-medium text-white text-sm">Messages</div>
                        <div className="text-xs text-neutral-500 mt-1">Chat with contributors</div>
                    </Link>
                    <Link to="/wallet" className="p-4 rounded-xl border border-white/[0.08] bg-[#0A0A0A] hover:border-white/20 transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-3 group-hover:bg-orange-500/20 transition-colors">
                            <Wallet className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="font-medium text-white text-sm">Wallet</div>
                        <div className="text-xs text-neutral-500 mt-1">Manage payments</div>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
