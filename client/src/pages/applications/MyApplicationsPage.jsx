import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Clock, CheckCircle2, XCircle, ArrowRight, Briefcase, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonApplicationCard, SkeletonStatsCard } from '../../components/ui/Skeleton';

const STATUS_CONFIG = {
    pending: { label: 'Pending Review', color: 'bg-yellow-500/10 text-yellow-500', icon: Clock },
    shortlisted: { label: 'Shortlisted', color: 'bg-blue-500/10 text-blue-500', icon: CheckCircle2 },
    accepted: { label: 'Accepted', color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-500', icon: XCircle },
    withdrawn: { label: 'Withdrawn', color: 'bg-zinc-500/10 text-zinc-500', icon: XCircle },
};

export default function MyApplicationsPage() {
    const { user } = useAuthStore();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await api.get('/api/v1/contributors/me/applications');
            setApplications(response.applications || response || []);
        } catch (error) {
            console.error('Failed to fetch applications:', error);
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (missionId, applicationId) => {
        try {
            await api.patch(`/api/v1/missions/${missionId}/applications/${applicationId}`, {
                status: 'withdrawn'
            });
            toast.success('Application withdrawn');
            fetchApplications();
        } catch (error) {
            toast.error('Failed to withdraw application');
        }
    };

    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        accepted: applications.filter(a => a.status === 'accepted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-6 md:p-8 max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-white">My Applications</h1>
                            <p className="text-zinc-400 mt-1">Track the status of your mission applications</p>
                        </div>
                        <div className="w-36 h-10 rounded bg-zinc-800 animate-pulse" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <SkeletonStatsCard key={i} />
                        ))}
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
            <div className="p-6 md:p-8 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">My Applications</h1>
                        <p className="text-zinc-400 mt-1">Track the status of your mission applications</p>
                    </div>
                    <Link
                        to="/explore"
                        className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2"
                    >
                        Browse Missions <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <p className="text-zinc-500 text-sm">Total Applications</p>
                        <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <p className="text-zinc-500 text-sm">Pending</p>
                        <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.pending}</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <p className="text-zinc-500 text-sm">Accepted</p>
                        <p className="text-2xl font-bold text-green-500 mt-1">{stats.accepted}</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <p className="text-zinc-500 text-sm">Rejected</p>
                        <p className="text-2xl font-bold text-red-500 mt-1">{stats.rejected}</p>
                    </div>
                </div>

                {applications.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <Briefcase className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No Applications Yet</h3>
                        <p className="text-zinc-400 mb-6">Start exploring missions to find your next project</p>
                        <Link
                            to="/explore"
                            className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-zinc-200 transition-colors inline-flex items-center gap-2"
                        >
                            Explore Missions <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {applications.map((application) => {
                            const StatusIcon = STATUS_CONFIG[application.status]?.icon || Clock;
                            const statusConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG.pending;

                            return (
                                <div
                                    key={application.id}
                                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Link
                                                    to={`/missions/${application.missionId}`}
                                                    className="text-lg font-semibold text-white hover:underline truncate"
                                                >
                                                    {application.missionTitle || 'Mission'}
                                                </Link>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.color} flex items-center gap-1`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusConfig.label}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-zinc-400 mb-3">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    Applied {new Date(application.createdAt).toLocaleDateString()}
                                                </span>
                                                {application.proposedTimeline && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" />
                                                        {application.proposedTimeline} days proposed
                                                    </span>
                                                )}
                                            </div>

                                            {application.coverLetter && (
                                                <p className="text-zinc-400 text-sm line-clamp-2">
                                                    {application.coverLetter}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/missions/${application.missionId}`}
                                                className="px-3 py-1.5 text-sm bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors"
                                            >
                                                View Mission
                                            </Link>
                                            {application.status === 'pending' && (
                                                <button
                                                    onClick={() => handleWithdraw(application.missionId, application.id)}
                                                    className="px-3 py-1.5 text-sm bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
                                                >
                                                    Withdraw
                                                </button>
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
