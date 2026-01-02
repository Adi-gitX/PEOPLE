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
            setStats(response);
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
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                        <p className="text-zinc-400 mt-1">Platform overview and management</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 animate-pulse">
                                <div className="h-4 w-16 bg-zinc-800 rounded mb-2" />
                                <div className="h-8 w-12 bg-zinc-800 rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        {statCards.map((stat, i) => (
                            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-1.5 rounded ${stat.bg}`}>
                                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                    </div>
                                    <span className="text-xs text-zinc-500">{stat.label}</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link
                        to="/admin/users"
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">User Management</h3>
                        <p className="text-sm text-zinc-400">View, verify, and manage platform users</p>
                    </Link>

                    <Link
                        to="/admin/missions"
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-lg">
                                <Briefcase className="w-6 h-6 text-purple-400" />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">Mission Management</h3>
                        <p className="text-sm text-zinc-400">Monitor and moderate missions</p>
                    </Link>

                    <Link
                        to="/admin/disputes"
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-red-500/10 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">Disputes</h3>
                        <p className="text-sm text-zinc-400">Review and resolve payment disputes</p>
                    </Link>
                </div>

                {stats?.totalEarnings > 0 && (
                    <div className="mt-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6">
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-8 h-8 text-green-400" />
                            <div>
                                <p className="text-sm text-green-400">Total Platform Earnings</p>
                                <p className="text-3xl font-bold text-white">${stats.totalEarnings.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
