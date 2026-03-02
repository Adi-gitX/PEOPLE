import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, CreditCard, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';

export default function AdminPaymentsPage() {
    const [loading, setLoading] = useState(true);
    const [intents, setIntents] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [provider, setProvider] = useState('');
    const [status, setStatus] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const intentParams = new URLSearchParams();
            intentParams.append('limit', '100');
            if (provider) intentParams.append('provider', provider);
            if (status) intentParams.append('status', status);

            const escrowParams = new URLSearchParams();
            escrowParams.append('limit', '100');

            const [intentsResponse, accountsResponse] = await Promise.all([
                api.get(`/api/v1/admin/payments/intents?${intentParams.toString()}`),
                api.get(`/api/v1/admin/escrow/accounts?${escrowParams.toString()}`),
            ]);

            setIntents(intentsResponse.data?.intents || []);
            setAccounts(accountsResponse.data?.accounts || []);
        } catch (error) {
            console.error('Failed to fetch admin payments data:', error);
            toast.error('Failed to load payments and escrow data');
        } finally {
            setLoading(false);
        }
    }, [provider, status]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                    <h1 className="text-3xl font-bold tracking-tighter text-white">Payments and Escrow</h1>
                    <p className="text-neutral-400 mt-1">Monitor funding intents and escrow account states.</p>
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                    <select
                        value={provider}
                        onChange={(event) => setProvider(event.target.value)}
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white"
                    >
                        <option value="">all providers</option>
                        <option value="stripe">stripe</option>
                        <option value="razorpay">razorpay</option>
                    </select>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white"
                    >
                        <option value="">all statuses</option>
                        <option value="pending">pending</option>
                        <option value="requires_action">requires_action</option>
                        <option value="succeeded">succeeded</option>
                        <option value="failed">failed</option>
                        <option value="cancelled">cancelled</option>
                    </select>
                    <button
                        type="button"
                        onClick={fetchData}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors"
                    >
                        <RefreshCcw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <section className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/[0.08] text-sm text-neutral-300 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Payment Intents
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                            {loading && <div className="p-6 text-sm text-neutral-500">Loading payment intents...</div>}
                            {!loading && intents.length === 0 && <div className="p-6 text-sm text-neutral-500">No payment intents found.</div>}
                            {!loading && intents.map((intent) => (
                                <div key={intent.id} className="p-4 border-b border-white/[0.06]">
                                    <p className="text-sm text-white font-semibold">{intent.provider} • {intent.status}</p>
                                    <p className="text-xs text-neutral-400 mt-1">
                                        {intent.currency} {(Number(intent.amountMinor || 0) / 100).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">mission: {intent.missionId}</p>
                                    <p className="text-xs text-neutral-500">intent: {intent.id}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/[0.08] text-sm text-neutral-300 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Escrow Accounts
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                            {loading && <div className="p-6 text-sm text-neutral-500">Loading escrow accounts...</div>}
                            {!loading && accounts.length === 0 && <div className="p-6 text-sm text-neutral-500">No escrow accounts found.</div>}
                            {!loading && accounts.map((account) => (
                                <div key={account.id} className="p-4 border-b border-white/[0.06]">
                                    <p className="text-sm text-white font-semibold">{account.status}</p>
                                    <p className="text-xs text-neutral-400 mt-1">
                                        balance: {account.currency?.toUpperCase()} {Number(account.balance || 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">mission: {account.missionId}</p>
                                    <p className="text-xs text-neutral-500">escrow: {account.id}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}
