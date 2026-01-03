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

    const [verificationStatus, setVerificationStatus] = useState(null);

    useEffect(() => {
        fetchApplications();
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/v1/contributors/me');
            if (response?.data) {
                setVerificationStatus(response.data.verificationStatus);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const fetchApplications = async () => {
        try {
            const response = await api.get('/api/v1/contributors/me/applications');
            setApplications(response.data?.applications || response.data || []);
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

    const safeApplications = Array.isArray(applications) ? applications : [];

    const stats = {
        total: safeApplications.length,
        pending: safeApplications.filter(a => a.status === 'pending').length,
        accepted: safeApplications.filter(a => a.status === 'accepted').length,
        rejected: safeApplications.filter(a => a.status === 'rejected').length,
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
            <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter text-white">My Applications</h1>
                        <p className="text-neutral-400 mt-1">Track the status of your mission applications</p>
                    </div>
                    <Link
                        to="/explore"
                        className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2"
                    >
                        Browse Missions <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6">
                        <p className="text-neutral-500 text-sm font-medium">Total Applications</p>
                        <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stats.total}</p>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6">
                        <p className="text-neutral-500 text-sm font-medium">Pending</p>
                        <p className="text-3xl font-bold text-yellow-500 mt-2 tracking-tight">{stats.pending}</p>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6">
                        <p className="text-neutral-500 text-sm font-medium">Accepted</p>
                        <p className="text-3xl font-bold text-green-500 mt-2 tracking-tight">{stats.accepted}</p>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6">
                        <p className="text-neutral-500 text-sm font-medium">Rejected</p>
                        <p className="text-3xl font-bold text-red-500 mt-2 tracking-tight">{stats.rejected}</p>
                    </div>
                </div>

                {safeApplications.length === 0 ? (
                    <div className="text-center py-20 bg-[#0A0A0A] border border-white/[0.08] rounded-xl">
                        <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/[0.05]">
                            <Briefcase className="w-8 h-8 text-neutral-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No Applications Yet</h3>
                        <p className="text-neutral-400 mb-8 max-w-sm mx-auto">Start exploring the marketplace to find your next mission and build your reputation.</p>
                        <Link
                            to="/explore"
                            className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
                        >
                            Explore Missions <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Verification Application Card */}
                        {(verificationStatus === 'pending' || verificationStatus === 'proof_task_submitted') && (
                            <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition-all group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-lg font-semibold text-white tracking-tight">
                                                Entrance Verification
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                Pending Review
                                            </span>
                                        </div>
                                        <div className="text-sm text-neutral-400 font-medium">
                                            Platform Access Request
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-2">
                                            Your analysis is currently under review by our team.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button disabled className="px-4 py-2 text-sm bg-white/[0.05] text-neutral-400 border border-white/[0.05] rounded-lg cursor-not-allowed font-medium">
                                            Under Review
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {safeApplications.map((application) => {
                            const StatusIcon = STATUS_CONFIG[application.status]?.icon || Clock;
                            const statusConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG.pending;

                            return (
                                <div
                                    key={application.id}
                                    className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Link
                                                    to={`/missions/${application.missionId}`}
                                                    className="text-lg font-semibold text-white hover:text-blue-400 transition-colors truncate tracking-tight"
                                                >
                                                    {application.missionTitle || 'Mission'}
                                                </Link>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color} border border-current/20 flex items-center gap-1.5`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusConfig.label}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm text-neutral-400 mb-4">
                                                <span className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-neutral-500" />
                                                    Applied {new Date(application.createdAt).toLocaleDateString()}
                                                </span>
                                                {application.proposedTimeline && (
                                                    <span className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-neutral-500" />
                                                        {application.proposedTimeline} days proposed
                                                    </span>
                                                )}
                                            </div>

                                            {application.coverLetter && (
                                                <p className="text-neutral-500 text-sm line-clamp-2 leading-relaxed">
                                                    {application.coverLetter}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Link
                                                to={`/missions/${application.missionId}`}
                                                className="px-4 py-2 text-sm bg-white/[0.05] text-white border border-white/[0.08] rounded-lg hover:bg-white/[0.1] transition-colors font-medium"
                                            >
                                                View Mission
                                            </Link>
                                            {application.status === 'pending' && (
                                                <button
                                                    onClick={() => handleWithdraw(application.missionId, application.id)}
                                                    className="px-4 py-2 text-sm bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors font-medium"
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
