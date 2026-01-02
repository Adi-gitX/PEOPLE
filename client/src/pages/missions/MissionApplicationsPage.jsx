import { useState, useEffect } from 'react';
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

    useEffect(() => {
        fetchData();
    }, [missionId]);

    const fetchData = async () => {
        try {
            const [missionRes, appsRes] = await Promise.all([
                api.get(`/api/v1/missions/${missionId}`),
                api.get(`/api/v1/missions/${missionId}/applications`),
            ]);
            setMission(missionRes.mission || missionRes);
            setApplications(appsRes || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (applicationId, status) => {
        setProcessing(applicationId);
        try {
            await api.patch(`/api/v1/missions/${missionId}/applications/${applicationId}`, { status });
            toast.success(`Application ${status}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update application');
        } finally {
            setProcessing(null);
        }
    };

    const handleAssign = async (contributorId) => {
        setProcessing(contributorId);
        try {
            await api.post(`/api/v1/missions/${missionId}/assign`, {
                contributorId,
                role: 'lead',
            });
            toast.success('Contributor assigned to mission!');
            fetchData();
        } catch (error) {
            toast.error('Failed to assign contributor');
        } finally {
            setProcessing(null);
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
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Applications for Mission</h1>
                    {mission && (
                        <p className="text-zinc-400 mt-1">{mission.title}</p>
                    )}
                </div>

                {applications.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <User className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No Applications Yet</h3>
                        <p className="text-zinc-400">Contributors haven't applied to this mission yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {applications.map((application) => {
                            const StatusIcon = STATUS_CONFIG[application.status]?.icon || Clock;
                            const statusConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG.pending;
                            const isProcessing = processing === application.id || processing === application.contributorId;

                            return (
                                <div
                                    key={application.id}
                                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-zinc-400" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">
                                                        {application.contributorName || 'Anonymous'}
                                                    </p>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color} inline-flex items-center gap-1`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    Applied {new Date(application.createdAt).toLocaleDateString()}
                                                </span>
                                                {application.proposedTimeline && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" />
                                                        {application.proposedTimeline} days timeline
                                                    </span>
                                                )}
                                            </div>

                                            {application.coverLetter && (
                                                <div className="mb-4">
                                                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                        <FileText className="w-3 h-3" /> Cover Letter
                                                    </p>
                                                    <p className="text-zinc-300 text-sm">{application.coverLetter}</p>
                                                </div>
                                            )}

                                            {application.proposedApproach && (
                                                <div>
                                                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Proposed Approach</p>
                                                    <p className="text-zinc-300 text-sm">{application.proposedApproach}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {application.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(application.id, 'shortlisted')}
                                                        disabled={isProcessing}
                                                        className="px-3 py-1.5 text-sm bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                                    >
                                                        Shortlist
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(application.id, 'rejected')}
                                                        disabled={isProcessing}
                                                        className="px-3 py-1.5 text-sm bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {application.status === 'shortlisted' && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            handleStatusUpdate(application.id, 'accepted');
                                                            handleAssign(application.contributorId);
                                                        }}
                                                        disabled={isProcessing}
                                                        className="px-3 py-1.5 text-sm bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <UserPlus className="w-3 h-3" />
                                                        Accept & Assign
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(application.id, 'rejected')}
                                                        disabled={isProcessing}
                                                        className="px-3 py-1.5 text-sm bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {application.status === 'accepted' && (
                                                <span className="px-3 py-1.5 text-sm bg-green-500/10 text-green-500 rounded">
                                                    ✓ Assigned
                                                </span>
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
