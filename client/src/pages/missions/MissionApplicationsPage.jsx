import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { Clock, CheckCircle2, XCircle, ArrowLeft, User, Calendar, FileText, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonApplicationCard, Skeleton } from '../../components/ui/Skeleton';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500', icon: Clock },
    shortlisted: { label: 'Shortlisted', color: 'bg-blue-500/10 text-blue-500', icon: CheckCircle2 },
    accepted: { label: 'Accepted', color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-500', icon: XCircle },
    withdrawn: { label: 'Withdrawn', color: 'bg-zinc-500/10 text-zinc-500', icon: XCircle },
};

export default function MissionApplicationsPage() {
    const { id: missionId } = useParams();
    const [mission, setMission] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [matchPayload, setMatchPayload] = useState(null);
    const [matchLoading, setMatchLoading] = useState(false);
    const [matchRunning, setMatchRunning] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [missionRes, appsRes] = await Promise.all([
                api.get(`/api/v1/missions/${missionId}`),
                api.get(`/api/v1/missions/${missionId}/applications`),
            ]);
            setMission(missionRes.data?.mission || missionRes.data);
            setApplications(appsRes.data || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    }, [missionId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchMatchingResults = useCallback(async () => {
        setMatchLoading(true);
        try {
            const response = await api.get(`/api/v1/matching/missions/${missionId}/results`);
            const payload = response.data || response;
            setMatchPayload(payload);
        } catch {
            setMatchPayload(null);
        } finally {
            setMatchLoading(false);
        }
    }, [missionId]);

    useEffect(() => {
        fetchMatchingResults();
    }, [fetchMatchingResults]);

    const handleStatusUpdate = async (applicationId, status) => {
        setProcessing(applicationId);
        try {
            await api.patch(`/api/v1/missions/${missionId}/applications/${applicationId}`, { status });
            toast.success(`Application ${status}`);
            fetchData();
        } catch {
            toast.error('Failed to update application');
        } finally {
            setProcessing(null);
        }
    };

    const handleAcceptAndAssign = async (application) => {
        setProcessing(`accept-${application.id}`);
        try {
            await api.patch(`/api/v1/missions/${missionId}/applications/${application.id}`, { status: 'accepted' });
            await api.post(`/api/v1/missions/${missionId}/assign`, {
                contributorId: application.contributorId,
                role: 'lead',
            });

            // Bootstrap direct chat after assignment
            try {
                await api.post('/api/v1/conversations/start', { recipientId: application.contributorId });
            } catch {
                // Assignment succeeded; chat can be started manually later
            }
            toast.success('Contributor accepted and assigned');
            fetchData();
        } catch {
            toast.error('Failed to accept and assign contributor');
        } finally {
            setProcessing(null);
        }
    };

    const handleRunMatching = async () => {
        setMatchRunning(true);
        try {
            const response = await api.post(`/api/v1/matching/missions/${missionId}/run`, {
                limit: 10,
                minimumScore: 30,
            });
            const payload = response.data || response;
            setMatchPayload(payload);
            toast.success('Matching refreshed');
        } catch (error) {
            toast.error(error.message || 'Failed to refresh matches');
        } finally {
            setMatchRunning(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-6 md:p-8 max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 text-zinc-400 mb-6">
                        <Skeleton className="h-4 w-32" />
                    </div>

                    <div className="mb-8">
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-5 w-48" />
                    </div>

                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <SkeletonApplicationCard key={i} />
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                <Link
                    to="/dashboard/initiator"
                    className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>

                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-white tracking-tighter">Mission Applications</h1>
                    {mission && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-neutral-400">for</span>
                            <span className="text-white font-medium">{mission.title}</span>
                        </div>
                    )}
                </div>

                <div className="mb-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A] p-5">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white tracking-tight">AI Best Matches</h2>
                            <p className="text-xs text-neutral-500">
                                Ranked by mission fit score and refreshed every 2 hours.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleRunMatching}
                            disabled={matchRunning}
                            className="px-3 py-2 text-xs rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-60"
                        >
                            {matchRunning ? 'Refreshing...' : 'Refresh Matches'}
                        </button>
                    </div>

                    {matchLoading ? (
                        <p className="text-sm text-zinc-500">Loading ranked contributors...</p>
                    ) : !matchPayload?.matches?.length ? (
                        <p className="text-sm text-zinc-500">No ranked matches available yet.</p>
                    ) : (
                        <>
                            <div className="grid gap-3 md:grid-cols-2">
                                {matchPayload.matches.slice(0, 6).map((match) => (
                                    <div key={match.contributorId} className="rounded-lg border border-white/10 bg-black/40 p-3">
                                        <div className="flex items-center justify-between gap-2">
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

                {applications.length === 0 ? (
                    <div className="text-center py-24 bg-[#0A0A0A] border border-white/[0.08] rounded-xl">
                        <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-6">
                            <User className="w-8 h-8 text-neutral-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No Applications Yet</h3>
                        <p className="text-neutral-500 max-w-sm mx-auto">Top talent will start applying soon. Share your mission to attract more contributors.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {applications.map((application) => {
                            const StatusIcon = STATUS_CONFIG[application.status]?.icon || Clock;
                            const statusConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG.pending;
                            const isProcessing = processing === application.id
                                || processing === application.contributorId
                                || processing === `accept-${application.id}`;

                            return (
                                <div
                                    key={application.id}
                                    className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 transition-all hover:border-white/[0.15] group"
                                >
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.05] rounded-xl flex items-center justify-center shrink-0">
                                                    <User className="w-6 h-6 text-neutral-400" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-white tracking-tight">
                                                        {application.contributorName || 'Anonymous'}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color} border border-current/10 inline-flex items-center gap-1.5`}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {statusConfig.label}
                                                        </span>
                                                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(application.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6 pl-16">
                                                {application.coverLetter && (
                                                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-4">
                                                        <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                                                            <FileText className="w-3 h-3" /> Cover Letter
                                                        </p>
                                                        <p className="text-neutral-300 text-sm leading-relaxed">{application.coverLetter}</p>
                                                    </div>
                                                )}

                                                {application.proposedApproach && (
                                                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-4">
                                                        <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-2">Proposed Approach</p>
                                                        <p className="text-neutral-300 text-sm leading-relaxed">{application.proposedApproach}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {application.proposedTimeline && (
                                                <div className="pl-16 mt-4 flex items-center gap-2 text-sm text-neutral-400">
                                                    <Clock className="w-4 h-4" />
                                                    <span>Proposed Timeline: <span className="text-white font-medium">{application.proposedTimeline} days</span></span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-3 min-w-[140px]">
                                            {application.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(application.id, 'shortlisted')}
                                                        disabled={isProcessing}
                                                        className="px-4 py-2 text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all font-medium disabled:opacity-50"
                                                    >
                                                        Shortlist
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(application.id, 'rejected')}
                                                        disabled={isProcessing}
                                                        className="px-4 py-2 text-sm bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all font-medium disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {application.status === 'shortlisted' && (
                                                <>
                                                    <button
                                                        onClick={() => handleAcceptAndAssign(application)}
                                                        disabled={isProcessing}
                                                        className="px-4 py-2 text-sm bg-green-500 text-black rounded-lg hover:bg-green-400 transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                                    >
                                                        <UserPlus className="w-4 h-4" />
                                                        Accept & Assign
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(application.id, 'rejected')}
                                                        disabled={isProcessing}
                                                        className="px-4 py-2 text-sm bg-white/[0.05] text-neutral-400 border border-white/[0.1] rounded-lg hover:bg-white/[0.1] hover:text-white transition-all font-medium disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {application.status === 'accepted' && (
                                                <div className="px-4 py-3 text-sm bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg flex items-center justify-center gap-2 font-medium">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Assigned
                                                </div>
                                            )}
                                            {application.status === 'rejected' && (
                                                <div className="px-4 py-3 text-sm bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg flex items-center justify-center gap-2 font-medium">
                                                    <XCircle className="w-4 h-4" />
                                                    Rejected
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
