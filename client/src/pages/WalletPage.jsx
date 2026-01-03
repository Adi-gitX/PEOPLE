import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { api } from '../lib/api';
import { Wallet, TrendingUp, ArrowDownRight, ArrowUpRight, Clock, DollarSign, Building } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import { toast } from 'sonner';

const TYPE_LABELS = {
    deposit: { label: 'Deposit', icon: ArrowDownRight, color: 'text-green-500' },
    release: { label: 'Earning', icon: ArrowUpRight, color: 'text-green-500' },
    refund: { label: 'Refund', icon: ArrowDownRight, color: 'text-yellow-500' },
    platform_fee: { label: 'Fee', icon: Building, color: 'text-zinc-400' },
};

export default function WalletPage() {
    const [balance, setBalance] = useState({ available: 0, pending: 0, total: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [balanceRes, historyRes] = await Promise.all([
                api.get('/api/v1/payments/balance'),
                api.get('/api/v1/payments/history'),
            ]);
            setBalance(balanceRes);
            setTransactions(historyRes.transactions || []);
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = () => {
        toast.info('Withdrawals coming soon!', {
            description: 'Bank account linking will be available in the next update.',
        });
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
                                    onClick={handleWithdraw}
                                    className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg shadow-green-500/20"
                                    disabled={balance.available === 0}
                                >
                                    Withdraw Funds
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
                    <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
                        <h2 className="text-lg font-bold tracking-tight text-white">Transaction History</h2>
                        <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                            View All
                        </Button>
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
                                const typeConfig = TYPE_LABELS[tx.type] || TYPE_LABELS.release;
                                const Icon = typeConfig.icon;

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
                                            <p className={`font-bold tracking-tight text-lg ${tx.type === 'release' ? 'text-green-500' : 'text-white'}`}>
                                                {tx.type === 'release' ? '+' : ''}${tx.amount?.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-neutral-600 font-medium">
                                                {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
