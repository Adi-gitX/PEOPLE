import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Clock3, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';

const STATUS_OPTIONS = ['', 'pending', 'processing', 'completed', 'failed', 'cancelled'];

export default function AdminWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [processingId, setProcessingId] = useState('');

    const fetchWithdrawals = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('limit', '100');
            if (status) params.append('status', status);

            const response = await api.get(`/api/v1/admin/withdrawals?${params.toString()}`);
            setWithdrawals(response.data?.withdrawals || []);
        } catch (error) {
            console.error('Failed to fetch admin withdrawals:', error);
            toast.error('Failed to load withdrawals');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchWithdrawals();
    }, [fetchWithdrawals]);

    const updateStatus = async (withdrawalId, action) => {
        const requiresConfirm = action === 'reject' || action === 'mark_paid';
        if (requiresConfirm && !window.confirm(`Confirm ${action.replace('_', ' ')} for this withdrawal?`)) {
            return;
        }

        const notes = window.prompt('Add note (optional):') || '';
        const transactionReference = action === 'mark_paid'
            ? (window.prompt('Transaction reference (optional):') || '')
            : '';

        setProcessingId(withdrawalId);
        try {
            await api.patch(`/api/v1/admin/withdrawals/${withdrawalId}`, {
                action,
                notes: notes.trim() || undefined,
                transactionReference: transactionReference.trim() || undefined,
            });
            toast.success(`Withdrawal ${action.replace('_', ' ')}`);
            await fetchWithdrawals();
        } catch (error) {
            console.error('Failed to update withdrawal:', error);
            toast.error('Failed to update withdrawal');
        } finally {
            setProcessingId('');
        }
    };

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
                    <h1 className="text-3xl font-bold tracking-tighter text-white">Withdrawal Queue</h1>
                    <p className="text-neutral-400 mt-1">Approve, reject, and mark payout requests as paid.</p>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <Filter className="w-4 h-4 text-neutral-500" />
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option ? option : 'all statuses'}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={fetchWithdrawals}
                        className="px-4 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-black/40 border-b border-white/[0.05]">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs text-neutral-500 uppercase">User</th>
                                <th className="text-left px-4 py-3 text-xs text-neutral-500 uppercase">Amount</th>
                                <th className="text-left px-4 py-3 text-xs text-neutral-500 uppercase">Status</th>
                                <th className="text-left px-4 py-3 text-xs text-neutral-500 uppercase">Created</th>
                                <th className="text-right px-4 py-3 text-xs text-neutral-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {loading && (
                                <tr>
                                    <td className="px-4 py-8 text-neutral-500 text-sm" colSpan={5}>Loading withdrawals...</td>
                                </tr>
                            )}
                            {!loading && withdrawals.length === 0 && (
                                <tr>
                                    <td className="px-4 py-8 text-neutral-500 text-sm" colSpan={5}>No withdrawals found.</td>
                                </tr>
                            )}
                            {!loading && withdrawals.map((withdrawal) => {
                                const rowBusy = processingId === withdrawal.id;
                                return (
                                    <tr key={withdrawal.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-4 text-sm text-white">{withdrawal.userId}</td>
                                        <td className="px-4 py-4 text-sm text-white">
                                            {withdrawal.currency?.toUpperCase()} {Number(withdrawal.amount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-neutral-300">{withdrawal.status}</td>
                                        <td className="px-4 py-4 text-sm text-neutral-500">
                                            {withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {withdrawal.status === 'pending' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={rowBusy}
                                                            onClick={() => updateStatus(withdrawal.id, 'approve')}
                                                            className="p-2 rounded-lg text-green-300 bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 disabled:opacity-50"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={rowBusy}
                                                            onClick={() => updateStatus(withdrawal.id, 'reject')}
                                                            className="p-2 rounded-lg text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 disabled:opacity-50"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {withdrawal.status === 'processing' && (
                                                    <button
                                                        type="button"
                                                        disabled={rowBusy}
                                                        onClick={() => updateStatus(withdrawal.id, 'mark_paid')}
                                                        className="p-2 rounded-lg text-blue-300 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 disabled:opacity-50"
                                                        title="Mark paid"
                                                    >
                                                        <Clock3 className="w-4 h-4" />
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
            </div>
        </DashboardLayout>
    );
}
