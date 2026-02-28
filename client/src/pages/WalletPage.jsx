import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { api } from '../lib/api';
import { Wallet, TrendingUp, ArrowDownRight, ArrowUpRight, Clock, DollarSign, Building } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import { toast } from 'sonner';

const TYPE_LABELS = {
    earning: { label: 'Earning', icon: ArrowUpRight, color: 'text-green-500' },
    withdrawal: { label: 'Withdrawal', icon: ArrowDownRight, color: 'text-red-400' },
    refund: { label: 'Refund', icon: ArrowDownRight, color: 'text-yellow-500' },
    bonus: { label: 'Bonus', icon: ArrowUpRight, color: 'text-blue-400' },
    fee: { label: 'Processor Fee', icon: Building, color: 'text-zinc-400' },
    adjustment: { label: 'Adjustment', icon: Building, color: 'text-zinc-400' },
};

export default function WalletPage() {
    const [balance, setBalance] = useState({ available: 0, pending: 0, total: 0 });
    const [transactions, setTransactions] = useState([]);
    const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
    const [loading, setLoading] = useState(true);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({
        amount: '',
        payoutMethod: 'bank_transfer',
        payoutDetails: '',
    });

    const toDate = (value) => {
        if (!value) return null;
        if (value instanceof Date) return value;
        if (value?.seconds) return new Date(value.seconds * 1000);
        return new Date(value);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [summaryRes, transactionsRes] = await Promise.all([
                api.get('/api/v1/wallet/summary'),
                api.get('/api/v1/wallet/transactions?limit=50'),
            ]);

            const summary = summaryRes.data || {};
            const wallet = summary.wallet || {};

            setBalance({
                available: wallet.availableBalance || 0,
                pending: wallet.pendingBalance || 0,
                total: wallet.totalEarnings || 0,
            });
            setPendingWithdrawals(summary.pendingWithdrawals || 0);
            setTransactions(Array.isArray(transactionsRes.data) ? transactionsRes.data : []);
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
            toast.error('Failed to load wallet data');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawSubmit = async (e) => {
        e.preventDefault();
        const amount = Number(withdrawForm.amount);

        if (!Number.isFinite(amount) || amount < 10) {
            toast.error('Minimum withdrawal is $10');
            return;
        }

        if (amount > balance.available) {
            toast.error('Insufficient available balance');
            return;
        }

        if (!withdrawForm.payoutDetails.trim()) {
            toast.error('Please provide payout details');
            return;
        }

        setWithdrawing(true);
        try {
            await api.post('/api/v1/wallet/withdraw', {
                amount,
                payoutMethod: withdrawForm.payoutMethod,
                payoutDetails: {
                    account: withdrawForm.payoutDetails.trim(),
                },
            });

            toast.success('Withdrawal request submitted');
            setWithdrawOpen(false);
            setWithdrawForm({ amount: '', payoutMethod: 'bank_transfer', payoutDetails: '' });
            fetchData();
        } catch (error) {
            toast.error(error.message || 'Failed to submit withdrawal');
        } finally {
            setWithdrawing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter text-white">Wallet</h1>
                        <p className="text-neutral-400 mt-1">Manage your earnings and payments</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 animate-pulse">
                                <div className="h-4 w-20 bg-white/[0.05] rounded mb-4" />
                                <div className="h-8 w-32 bg-white/[0.05] rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full group-hover:bg-green-500/20 transition-all duration-500" />
                            <div className="relative">
                                <div className="flex items-center gap-2 text-green-400 mb-4">
                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-medium tracking-wide">Available Balance</span>
                                </div>
                                <p className="text-4xl font-bold text-white tracking-tight">${balance.available.toLocaleString()}</p>
                                <Button
                                    onClick={() => setWithdrawOpen(true)}
                                    className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg shadow-green-500/20"
                                    disabled={balance.available < 10}
                                >
                                    Request Withdrawal
                                </Button>
                            </div>
                        </div>

                        <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-8 hover:border-white/[0.15] transition-all">
                            <div className="flex items-center gap-2 text-yellow-500 mb-4">
                                <div className="p-2 bg-yellow-500/10 rounded-lg">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium tracking-wide">Pending</span>
                            </div>
                            <p className="text-4xl font-bold text-white tracking-tight">${balance.pending.toLocaleString()}</p>
                            <p className="text-sm text-neutral-500 mt-2">In escrow for active missions</p>
                            {pendingWithdrawals > 0 && (
                                <p className="text-xs text-neutral-500 mt-3">
                                    Pending withdrawals: ${pendingWithdrawals.toLocaleString()}
                                </p>
                            )}
                        </div>

                        <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-8 hover:border-white/[0.15] transition-all">
                            <div className="flex items-center gap-2 text-blue-400 mb-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium tracking-wide">Total Earned</span>
                            </div>
                            <p className="text-4xl font-bold text-white tracking-tight">${balance.total.toLocaleString()}</p>
                            <p className="text-sm text-neutral-500 mt-2">Lifetime earnings</p>
                        </div>
                    </div>
                )}

                <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/[0.08]">
                        <h2 className="text-lg font-bold tracking-tight text-white">Transaction History</h2>
                    </div>

                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-6">
                                <DollarSign className="w-8 h-8 text-neutral-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No Transactions Yet</h3>
                            <p className="text-neutral-500 max-w-sm mx-auto">Your payment history will appear here once you start completing missions.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.05]">
                            {transactions.map((tx) => {
                                const typeConfig = TYPE_LABELS[tx.type] || TYPE_LABELS.earning;
                                const Icon = typeConfig.icon;
                                const isPositive = (tx.amount || 0) > 0;

                                return (
                                    <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-5">
                                            <div className={`p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] group-hover:border-white/[0.1] transition-colors ${typeConfig.color}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white tracking-tight">{typeConfig.label}</p>
                                                <p className="text-sm text-neutral-500 mt-0.5">{tx.description}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold tracking-tight text-lg ${isPositive ? 'text-green-500' : 'text-white'}`}>
                                                {isPositive ? '+' : ''}${Math.abs(tx.amount || 0).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-neutral-600 font-medium">
                                                {tx.createdAt ? toDate(tx.createdAt)?.toLocaleDateString() : ''}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {withdrawOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80" onClick={() => setWithdrawOpen(false)} />
                        <form
                            onSubmit={handleWithdrawSubmit}
                            className="relative w-full max-w-md bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 space-y-4"
                        >
                            <h3 className="text-xl font-bold text-white tracking-tight">Request Withdrawal</h3>
                            <p className="text-sm text-neutral-500">
                                Available: ${balance.available.toLocaleString()} (minimum $10)
                            </p>

                            <div>
                                <label className="block text-sm text-neutral-400 mb-2">Amount (USD)</label>
                                <input
                                    type="number"
                                    min="10"
                                    step="0.01"
                                    value={withdrawForm.amount}
                                    onChange={(e) => setWithdrawForm((prev) => ({ ...prev, amount: e.target.value }))}
                                    required
                                    className="w-full h-11 px-3 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-neutral-400 mb-2">Payout Method</label>
                                <select
                                    value={withdrawForm.payoutMethod}
                                    onChange={(e) => setWithdrawForm((prev) => ({ ...prev, payoutMethod: e.target.value }))}
                                    className="w-full h-11 px-3 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                                >
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="paypal">PayPal</option>
                                    <option value="stripe">Stripe</option>
                                    <option value="payoneer">Payoneer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-neutral-400 mb-2">Payout Details</label>
                                <input
                                    type="text"
                                    value={withdrawForm.payoutDetails}
                                    onChange={(e) => setWithdrawForm((prev) => ({ ...prev, payoutDetails: e.target.value }))}
                                    required
                                    placeholder="Account email or bank reference"
                                    className="w-full h-11 px-3 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 border-white/10"
                                    onClick={() => setWithdrawOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-white text-black hover:bg-zinc-200"
                                    isLoading={withdrawing}
                                >
                                    Submit
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
