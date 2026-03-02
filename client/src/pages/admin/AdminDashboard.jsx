import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { Users, Briefcase, DollarSign, AlertTriangle, ArrowUpRight, TrendingUp, Activity, LifeBuoy, MessageSquare, Wallet, FileClock, UserCog, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const adminAccess = useAuthStore((state) => state.adminAccess);

    const hasScope = (scopes = []) => {
        if (!adminAccess || adminAccess.adminType === 'super_admin') return true;
        const scopeSet = new Set(adminAccess.scopes || []);
        return scopes.every((scope) => scopeSet.has(scope));
    };

    const canReadStats = hasScope(['users.read']);

    useEffect(() => {
        if (!canReadStats) {
            setLoading(false);
            return;
        }
        fetchStats();
    }, [canReadStats]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/v1/admin/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Contributors', value: stats?.totalContributors || 0, icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
        { label: 'Initiators', value: stats?.totalInitiators || 0, icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { label: 'Total Missions', value: stats?.totalMissions || 0, icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { label: 'Active Missions', value: stats?.activeMissions || 0, icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        { label: 'Completed', value: stats?.completedMissions || 0, icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    ];

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter text-white">Admin Dashboard</h1>
                        <p className="text-neutral-400 mt-1">Platform overview and management</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-5 animate-pulse">
                                <div className="h-4 w-16 bg-white/[0.05] rounded mb-3" />
                                <div className="h-8 w-12 bg-white/[0.05] rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
                        {statCards.map((stat, i) => (
                            <div key={i} className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.15] transition-all group">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`p-2 rounded-lg ${stat.bg} border border-current/10`}>
                                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                    </div>
                                    <span className="text-xs text-neutral-500 font-medium">{stat.label}</span>
                                </div>
                                <p className="text-3xl font-bold text-white tracking-tight">{stat.value.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link
                        to="/admin/users"
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition-all group"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 tracking-tight">User Management</h3>
                        <p className="text-sm text-neutral-500">View, verify, and manage platform users</p>
                    </Link>

                    <Link
                        to="/admin/missions"
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition-all group"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                <Briefcase className="w-6 h-6 text-purple-400" />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Mission Management</h3>
                        <p className="text-sm text-neutral-500">Monitor and moderate missions</p>
                    </Link>

                    <Link
                        to="/admin/disputes"
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition-all group"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Disputes</h3>
                        <p className="text-sm text-neutral-500">Review and resolve payment disputes</p>
                    </Link>

                    <Link
                        to="/admin/support"
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition-all group"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                                <LifeBuoy className="w-6 h-6 text-cyan-400" />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Support Queue</h3>
                        <p className="text-sm text-neutral-500">Manage support tickets and email replies</p>
                    </Link>

                    {hasScope(['messages.read']) && (
                        <Link
                            to="/admin/messages"
                            className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition-all group"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                    <MessageSquare className="w-6 h-6 text-amber-300" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Message Oversight</h3>
                            <p className="text-sm text-neutral-500">Review and moderate platform conversations</p>
                        </Link>
                    )}

                    {hasScope(['withdrawals.read']) && (
                        <Link
                            to="/admin/withdrawals"
                            className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition-all group"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <Wallet className="w-6 h-6 text-emerald-300" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Withdrawals</h3>
                            <p className="text-sm text-neutral-500">Approve and process payout requests</p>
                        </Link>
                    )}

                    {hasScope(['payments.read', 'escrow.read']) && (
                        <Link
                            to="/admin/payments"
                            className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition-all group"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20">
                                    <DollarSign className="w-6 h-6 text-sky-300" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Payments and Escrow</h3>
                            <p className="text-sm text-neutral-500">Track intents and escrow states</p>
                        </Link>
                    )}

                    {hasScope(['audit.read']) && (
                        <Link
                            to="/admin/audit"
                            className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition-all group"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="p-3 bg-zinc-500/10 rounded-xl border border-zinc-500/20">
                                    <FileClock className="w-6 h-6 text-zinc-300" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Audit Log</h3>
                            <p className="text-sm text-neutral-500">Review all sensitive admin actions</p>
                        </Link>
                    )}

                    {hasScope(['admins.manage']) && (
                        <Link
                            to="/admin/admins"
                            className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition-all group"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                    <UserCog className="w-6 h-6 text-rose-300" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Admin Governance</h3>
                            <p className="text-sm text-neutral-500">Promote, scope, and secure admin operators</p>
                        </Link>
                    )}

                    <Link
                        to="/admin/security"
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition-all group"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="p-3 bg-lime-500/10 rounded-xl border border-lime-500/20">
                                <ShieldCheck className="w-6 h-6 text-lime-300" />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Admin Security</h3>
                        <p className="text-sm text-neutral-500">Enroll TOTP MFA and verify session security posture</p>
                    </Link>
                </div>

                {stats?.totalEarnings > 0 && (
                    <div className="mt-10 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/20 rounded-xl">
                                <DollarSign className="w-8 h-8 text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-green-400 font-medium">Total Platform Earnings</p>
                                <p className="text-4xl font-bold text-white tracking-tight">${stats.totalEarnings.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
