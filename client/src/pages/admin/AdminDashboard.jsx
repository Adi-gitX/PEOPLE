import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { Users, Briefcase, DollarSign, AlertTriangle, ArrowUpRight, TrendingUp, Activity } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

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
