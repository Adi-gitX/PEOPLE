import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, FileClock } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        actorId: '',
        scope: '',
        action: '',
    });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('limit', '100');
            if (filters.actorId.trim()) params.append('actorId', filters.actorId.trim());
            if (filters.scope.trim()) params.append('scope', filters.scope.trim());
            if (filters.action.trim()) params.append('action', filters.action.trim());

            const response = await api.get(`/api/v1/admin/audit-logs?${params.toString()}`);
            setLogs(response.data?.logs || []);
        } catch (error) {
            console.error('Failed to fetch admin audit logs:', error);
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, [filters.action, filters.actorId, filters.scope]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tighter text-white">Admin Audit Log</h1>
                    <p className="text-neutral-400 mt-1">Review sensitive admin actions and moderation history.</p>
                </div>

                <div className="grid md:grid-cols-4 gap-3 mb-6">
                    <input
                        type="text"
                        value={filters.actorId}
                        onChange={(event) => setFilters((prev) => ({ ...prev, actorId: event.target.value }))}
                        placeholder="actorId"
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white"
                    />
                    <input
                        type="text"
                        value={filters.scope}
                        onChange={(event) => setFilters((prev) => ({ ...prev, scope: event.target.value }))}
                        placeholder="scope"
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white"
                    />
                    <input
                        type="text"
                        value={filters.action}
                        onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value }))}
                        placeholder="action"
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white"
                    />
                    <button
                        type="button"
                        onClick={fetchLogs}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors"
                    >
                        <RefreshCcw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl overflow-hidden">
                    {loading && (
                        <div className="p-6 text-sm text-neutral-500">Loading audit logs...</div>
                    )}
                    {!loading && logs.length === 0 && (
                        <div className="p-8 text-center text-neutral-500">
                            <FileClock className="w-8 h-8 mx-auto mb-3 opacity-50" />
                            No audit logs found.
                        </div>
                    )}
                    {!loading && logs.map((log) => (
                        <div key={log.id} className="p-4 border-b last:border-b-0 border-white/[0.06]">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-white font-semibold">
                                    {log.action} <span className="text-neutral-500">({log.scope})</span>
                                </p>
                                <p className="text-xs text-neutral-500">
                                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            <p className="text-xs text-neutral-400 mt-1">
                                actor: {log.actorId} • resource: {log.resourceType}{log.resourceId ? `/${log.resourceId}` : ''}
                            </p>
                            {log.reason && (
                                <p className="text-xs text-neutral-500 mt-1">reason: {log.reason}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
