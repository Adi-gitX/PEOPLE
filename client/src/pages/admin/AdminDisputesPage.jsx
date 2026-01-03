import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonCard } from '../../components/ui/Skeleton';

const STATUS_CONFIG = {
    open: { label: 'Open', color: 'bg-red-500/10 text-red-500' },
    under_review: { label: 'Under Review', color: 'bg-yellow-500/10 text-yellow-500' },
    resolved: { label: 'Resolved', color: 'bg-green-500/10 text-green-500' },
    dismissed: { label: 'Dismissed', color: 'bg-zinc-500/10 text-zinc-400' },
};

export default function AdminDisputesPage() {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [resolution, setResolution] = useState('');
    const [favoredParty, setFavoredParty] = useState('');

    useEffect(() => {
        fetchDisputes();
    }, [filter]);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter) params.append('status', filter);

            const response = await api.get(`/api/v1/admin/disputes?${params.toString()}`);
            setDisputes(response.data?.disputes || []);
        } catch (error) {
            console.error('Failed to fetch disputes:', error);
            toast.error('Failed to load disputes');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async () => {
        if (!resolution.trim() || !favoredParty) {
            toast.error('Please provide resolution and select favored party');
            return;
        }

        try {
            await api.patch(`/api/v1/admin/disputes/${selectedDispute.id}/resolve`, {
                resolution: resolution.trim(),
                favoredParty,
            });
            toast.success('Dispute resolved');
            setSelectedDispute(null);
            setResolution('');
            setFavoredParty('');
            fetchDisputes();
        } catch (error) {
            toast.error('Failed to resolve dispute');
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Dispute Management</h1>
                        <p className="text-zinc-400 mt-1">Review and resolve payment disputes</p>
                    </div>
                </div>

                <div className="flex gap-4 mb-6">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white"
                    >
                        <option value="">All Disputes</option>
                        <option value="open">Open</option>
                        <option value="under_review">Under Review</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                    </select>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : disputes.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No Disputes</h3>
                        <p className="text-zinc-400">No disputes found matching your filter</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {disputes.map((dispute) => {
                            const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;

                            return (
                                <div
                                    key={dispute.id}
                                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-white">{dispute.missionTitle}</h3>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-400 mb-3">{dispute.reason}</p>
                                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                <span>Created: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                                                {dispute.resolvedAt && (
                                                    <span>Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                            {dispute.resolution && (
                                                <div className="mt-3 p-3 bg-zinc-800 rounded-lg">
                                                    <p className="text-xs text-zinc-400 mb-1">Resolution:</p>
                                                    <p className="text-sm text-white">{dispute.resolution}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/missions/${dispute.missionId}`}
                                                className="p-2 text-zinc-400 hover:text-white transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            {dispute.status === 'open' && (
                                                <button
                                                    onClick={() => setSelectedDispute(dispute)}
                                                    className="px-3 py-1.5 text-sm bg-white text-black rounded hover:bg-zinc-200 transition-colors"
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {selectedDispute && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedDispute(null)} />
                        <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Resolve Dispute</h3>
                            <p className="text-sm text-zinc-400 mb-4">{selectedDispute.missionTitle}</p>

                            <div className="mb-4">
                                <label className="block text-sm text-zinc-400 mb-2">Resolution</label>
                                <textarea
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    placeholder="Describe the resolution..."
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
                                    rows={4}
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm text-zinc-400 mb-2">Favored Party</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFavoredParty('initiator')}
                                        className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${favoredParty === 'initiator'
                                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                            }`}
                                    >
                                        Initiator
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFavoredParty('contributor')}
                                        className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${favoredParty === 'contributor'
                                            ? 'border-green-500 bg-green-500/10 text-green-400'
                                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                            }`}
                                    >
                                        Contributor
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedDispute(null)}
                                    className="flex-1 px-4 py-2 border border-zinc-700 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResolve}
                                    className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors"
                                >
                                    Resolve
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
