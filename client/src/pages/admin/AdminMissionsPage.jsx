import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { Briefcase, ArrowLeft, XCircle, Eye, Search } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonCard } from '../../components/ui/Skeleton';

const STATUS_CONFIG = {
    draft: { label: 'Draft', color: 'bg-zinc-500/10 text-zinc-400' },
    open: { label: 'Open', color: 'bg-green-500/10 text-green-500' },
    matching: { label: 'Matching', color: 'bg-blue-500/10 text-blue-500' },
    in_progress: { label: 'In Progress', color: 'bg-yellow-500/10 text-yellow-500' },
    in_review: { label: 'In Review', color: 'bg-purple-500/10 text-purple-500' },
    completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-500' },
    cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-500' },
    disputed: { label: 'Disputed', color: 'bg-orange-500/10 text-orange-500' },
};

export default function AdminMissionsPage() {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: '', search: '' });
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchMissions();
    }, [filter.status]);

    const fetchMissions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.status) params.append('status', filter.status);

            const response = await api.get(`/api/v1/admin/missions?${params.toString()}`);
            setMissions(response.missions || []);
            setTotal(response.total || 0);
        } catch (error) {
            console.error('Failed to fetch missions:', error);
            toast.error('Failed to load missions');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (missionId) => {
        if (!confirm('Are you sure you want to cancel this mission?')) return;

        try {
            await api.patch(`/api/v1/admin/missions/${missionId}/cancel`);
            toast.success('Mission cancelled');
            fetchMissions();
        } catch (error) {
            toast.error('Failed to cancel mission');
        }
    };

    const filteredMissions = missions.filter(mission =>
        !filter.search ||
        mission.title?.toLowerCase().includes(filter.search.toLowerCase()) ||
        mission.initiatorName?.toLowerCase().includes(filter.search.toLowerCase())
    );

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
                        <h1 className="text-2xl font-bold text-white">Mission Management</h1>
                        <p className="text-zinc-400 mt-1">{total} total missions</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <input
                            type="text"
                            value={filter.search}
                            onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
                            placeholder="Search missions..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                        />
                    </div>
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="open">Open</option>
                        <option value="matching">Matching</option>
                        <option value="in_progress">In Progress</option>
                        <option value="in_review">In Review</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="disputed">Disputed</option>
                    </select>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : filteredMissions.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <Briefcase className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No Missions Found</h3>
                        <p className="text-zinc-400">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-zinc-800/50">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Mission</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Initiator</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Budget</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Created</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {filteredMissions.map((mission) => {
                                    const statusConfig = STATUS_CONFIG[mission.status] || STATUS_CONFIG.draft;

                                    return (
                                        <tr key={mission.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-white truncate max-w-[200px]">{mission.title}</p>
                                                <p className="text-xs text-zinc-500">{mission.type}</p>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-zinc-300">
                                                {mission.initiatorName || 'Unknown'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-white">
                                                ${mission.budgetMin?.toLocaleString()} - ${mission.budgetMax?.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-zinc-400">
                                                {mission.createdAt ? new Date(mission.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/missions/${mission.id}`}
                                                        className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    {!['cancelled', 'completed'].includes(mission.status) && (
                                                        <button
                                                            onClick={() => handleCancel(mission.id)}
                                                            className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
