import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Plus, Clock, CheckCircle2, AlertCircle, Users, Wallet, Target, Loader2, MessageSquare, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useMyMissions } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export default function InitiatorDashboard() {
    const { user } = useAuthStore();
    const { data: missions, loading } = useMyMissions();
    const [selectedMissionId, setSelectedMissionId] = useState('');
    const [matchPayload, setMatchPayload] = useState(null);
    const [matchesLoading, setMatchesLoading] = useState(false);


    const allMissions = useMemo(() => missions || [], [missions]);
    const activeMissions = useMemo(
        () => allMissions.filter((mission) => mission.status === 'in_progress'),
        [allMissions]
    );
    const draftMissions = useMemo(
        () => allMissions.filter((mission) => mission.status === 'draft'),
        [allMissions]
    );
    const matchEligibleMissions = useMemo(
        () => allMissions.filter((mission) => ['open', 'matching', 'in_progress'].includes(mission.status)),
        [allMissions]
    );

    const totalEscrowed = allMissions.reduce((sum, m) => sum + (m.budgetMax || 0), 0);
    const totalContributors = allMissions.reduce((sum, m) => sum + (m.assignments?.length || 0), 0);

    useEffect(() => {
        if (!selectedMissionId && matchEligibleMissions.length > 0) {
            setSelectedMissionId(matchEligibleMissions[0].id);
        }
    }, [matchEligibleMissions, selectedMissionId]);

    useEffect(() => {
        if (!selectedMissionId) return;

        const loadMatches = async () => {
            setMatchesLoading(true);
            try {
                const response = await api.get(`/api/v1/matching/missions/${selectedMissionId}/results`);
                const payload = response.data || response;
                setMatchPayload(payload);
            } catch {
                setMatchPayload(null);
            } finally {
                setMatchesLoading(false);
            }
        };

        loadMatches();
    }, [selectedMissionId]);

    const refreshMatches = async () => {
        if (!selectedMissionId) return;
        setMatchesLoading(true);
        try {
            const response = await api.post(`/api/v1/matching/missions/${selectedMissionId}/run`, {
                limit: 10,
                minimumScore: 30,
            });
            const payload = response.data || response;
            setMatchPayload(payload);
            toast.success('Match list refreshed');
        } catch (error) {
            toast.error(error.message || 'Failed to refresh matches');
        } finally {
            setMatchesLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter mb-2 text-white">
                        Welcome, {user?.displayName?.split(' ')[0] || 'Initiator'}
                    </h1>
                    <p className="text-lg text-muted-foreground">Orchestrate your active problems and teams.</p>
                </div>
                <Link to="/dashboard/initiator/missions/new">
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

            <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0A] p-6 mb-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 className="font-bold tracking-tight text-white text-lg">AI Best Contributor Matches</h3>
                        <p className="text-xs text-zinc-500">Mission-fit rankings with percentage scores</p>
                    </div>
                    <button
                        type="button"
                        onClick={refreshMatches}
                        disabled={matchesLoading || !selectedMissionId}
                        className="px-3 py-2 rounded-lg border border-white/10 text-xs hover:bg-white/5 disabled:opacity-50"
                    >
                        {matchesLoading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {matchEligibleMissions.length > 0 && (
                    <div className="mb-4">
                        <label className="text-xs text-zinc-500 block mb-1">Mission</label>
                        <select
                            value={selectedMissionId}
                            onChange={(event) => setSelectedMissionId(event.target.value)}
                            className="w-full md:w-[360px] bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        >
                            {matchEligibleMissions.map((mission) => (
                                <option key={mission.id} value={mission.id}>
                                    {mission.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {matchEligibleMissions.length === 0 ? (
                    <p className="text-sm text-zinc-500">Create and publish a mission to see ranked contributors.</p>
                ) : matchesLoading ? (
                    <p className="text-sm text-zinc-500">Loading ranked contributors...</p>
                ) : !(matchPayload?.matches || []).length ? (
                    <p className="text-sm text-zinc-500">No ranked matches available yet for this mission.</p>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 gap-3">
                            {(matchPayload.matches || []).slice(0, 6).map((match) => (
                                <div key={match.contributorId} className="rounded-lg border border-white/10 bg-black/40 p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-white truncate">{match.contributorName || match.contributorId}</p>
                                        <span className="text-xs font-mono text-green-400">{match.overallScore}%</span>
                                    </div>
                                    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full bg-green-500"
                                            style={{ width: `${Math.min(100, Math.max(0, match.overallScore || 0))}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 text-[11px] text-zinc-500">
                                        Skills {match.skillScore}% · Trust {match.trustScore}% · Availability {match.availabilityScore}%
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 text-[11px] text-zinc-500">
                            {matchPayload.computedAt && (
                                <span>Computed: {new Date(matchPayload.computedAt).toLocaleString()} · </span>
                            )}
                            {matchPayload.expiresAt && (
                                <span>Refresh by: {new Date(matchPayload.expiresAt).toLocaleString()}</span>
                            )}
                        </div>
                    </>
                )}
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
                        <Link to="/dashboard/initiator/missions/new">
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
                                    <Link to={`/dashboard/initiator/missions/${mission.id}/applications`}>
                                        <Button variant="outline" size="sm" className="hidden md:flex border-white/10 hover:bg-white/10 h-9">
                                            Applications
                                        </Button>
                                    </Link>
                                    <Link to={`/dashboard/initiator/missions/${mission.id}`}>
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
                    <Link to="/dashboard/initiator/missions/new" className="p-4 rounded-xl border border-white/[0.08] bg-[#0A0A0A] hover:border-white/20 transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                            <Plus className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="font-medium text-white text-sm">Create Mission</div>
                        <div className="text-xs text-neutral-500 mt-1">Post a new project</div>
                    </Link>
                    <Link to="/dashboard/initiator/network" className="p-4 rounded-xl border border-white/[0.08] bg-[#0A0A0A] hover:border-white/20 transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                            <UserPlus className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="font-medium text-white text-sm">Find Talent</div>
                        <div className="text-xs text-neutral-500 mt-1">Browse contributors</div>
                    </Link>
                    <Link to="/dashboard/initiator/messages" className="p-4 rounded-xl border border-white/[0.08] bg-[#0A0A0A] hover:border-white/20 transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3 group-hover:bg-green-500/20 transition-colors">
                            <MessageSquare className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="font-medium text-white text-sm">Messages</div>
                        <div className="text-xs text-neutral-500 mt-1">Chat with contributors</div>
                    </Link>
                    <Link to="/dashboard/initiator/wallet" className="p-4 rounded-xl border border-white/[0.08] bg-[#0A0A0A] hover:border-white/20 transition-all group">
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
