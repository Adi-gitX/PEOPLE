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
            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Wallet</h1>
                        <p className="text-zinc-400 mt-1">Manage your earnings and payments</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 animate-pulse">
                                <div className="h-4 w-20 bg-zinc-800 rounded mb-4" />
                                <div className="h-8 w-32 bg-zinc-800 rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                <Wallet className="w-5 h-5" />
                                <span className="text-sm font-medium">Available Balance</span>
                            </div>
                            <p className="text-3xl font-bold text-white">${balance.available.toLocaleString()}</p>
                            <Button
                                onClick={handleWithdraw}
                                className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white"
                                disabled={balance.available === 0}
                            >
                                Withdraw
                            </Button>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <div className="flex items-center gap-2 text-yellow-400 mb-2">
                                <Clock className="w-5 h-5" />
                                <span className="text-sm font-medium">Pending</span>
                            </div>
                            <p className="text-3xl font-bold text-white">${balance.pending.toLocaleString()}</p>
                            <p className="text-xs text-zinc-500 mt-2">In escrow for active missions</p>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                                <TrendingUp className="w-5 h-5" />
                                <span className="text-sm font-medium">Total Earned</span>
                            </div>
                            <p className="text-3xl font-bold text-white">${balance.total.toLocaleString()}</p>
                            <p className="text-xs text-zinc-500 mt-2">Lifetime earnings</p>
                        </div>
                    </div>
                )}

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="font-semibold text-white">Transaction History</h2>
                    </div>

                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="p-12 text-center">
                            <DollarSign className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No Transactions Yet</h3>
                            <p className="text-zinc-500">Your payment history will appear here</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {transactions.map((tx) => {
                                const typeConfig = TYPE_LABELS[tx.type] || TYPE_LABELS.release;
                                const Icon = typeConfig.icon;

                                return (
                                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg bg-zinc-800 ${typeConfig.color}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{typeConfig.label}</p>
                                                <p className="text-sm text-zinc-500">{tx.description}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-semibold ${tx.type === 'release' ? 'text-green-500' : 'text-white'}`}>
                                                {tx.type === 'release' ? '+' : ''}${tx.amount?.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-zinc-500">
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
