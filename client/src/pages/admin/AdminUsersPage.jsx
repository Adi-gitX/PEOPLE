import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { Users, ArrowLeft, CheckCircle2, XCircle, Shield, Ban, Search } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonCard } from '../../components/ui/Skeleton';

const STATUS_CONFIG = {
    active: { label: 'Active', color: 'bg-green-500/10 text-green-500' },
    suspended: { label: 'Suspended', color: 'bg-yellow-500/10 text-yellow-500' },
    banned: { label: 'Banned', color: 'bg-red-500/10 text-red-500' },
    pending_verification: { label: 'Pending', color: 'bg-zinc-500/10 text-zinc-400' },
};

const ROLE_CONFIG = {
    contributor: { label: 'Contributor', color: 'text-blue-400' },
    initiator: { label: 'Initiator', color: 'text-purple-400' },
    admin: { label: 'Admin', color: 'text-red-400' },
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ role: '', status: '', search: '' });
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchUsers();
    }, [filter.role, filter.status]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.role) params.append('role', filter.role);
            if (filter.status) params.append('status', filter.status);

            const response = await api.get(`/api/v1/admin/users?${params.toString()}`);
            setUsers(response.data?.users || []);
            setTotal(response.data?.total || 0);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (userId, status) => {
        try {
            await api.patch(`/api/v1/admin/users/${userId}/status`, { status });
            toast.success(`User status updated to ${status}`);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update user status');
        }
    };

    const handleVerify = async (userId) => {
        try {
            await api.patch(`/api/v1/admin/users/${userId}/verify`);
            toast.success('User verified successfully');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to verify user');
        }
    };

    const filteredUsers = users.filter(user =>
        !filter.search ||
        user.fullName?.toLowerCase().includes(filter.search.toLowerCase()) ||
        user.email?.toLowerCase().includes(filter.search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
                </Link>

                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter text-white">User Management</h1>
                        <p className="text-neutral-400 mt-1">{total} total users</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-8">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                        <input
                            type="text"
                            value={filter.search}
                            onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
                            placeholder="Search users..."
                            className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/[0.2] transition-colors"
                        />
                    </div>
                    <select
                        value={filter.role}
                        onChange={(e) => setFilter(f => ({ ...f, role: e.target.value }))}
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/[0.2] transition-colors"
                    >
                        <option value="">All Roles</option>
                        <option value="contributor">Contributors</option>
                        <option value="initiator">Initiators</option>
                        <option value="admin">Admins</option>
                    </select>
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/[0.2] transition-colors"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                        <option value="pending_verification">Pending</option>
                    </select>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-24 bg-[#0A0A0A] border border-white/[0.08] rounded-xl">
                        <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-8 h-8 text-neutral-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No Users Found</h3>
                        <p className="text-neutral-500">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-black/40 border-b border-white/[0.05]">
                                <tr>
                                    <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">User</th>
                                    <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Role</th>
                                    <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-5 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Joined</th>
                                    <th className="text-right px-5 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.05]">
                                {filteredUsers.map((user) => {
                                    const statusConfig = STATUS_CONFIG[user.accountStatus] || STATUS_CONFIG.active;
                                    const roleConfig = ROLE_CONFIG[user.primaryRole] || ROLE_CONFIG.contributor;

                                    return (
                                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-5 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center justify-center text-white font-bold">
                                                        {user.fullName?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white tracking-tight">{user.fullName || 'Unknown'}</p>
                                                        <p className="text-sm text-neutral-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-5">
                                                <span className={`text-sm font-semibold ${roleConfig.color}`}>
                                                    {roleConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-5">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.color} border border-current/10`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-5 text-sm text-neutral-500">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-5 py-5">
                                                <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleVerify(user.id)}
                                                        className="p-2 text-neutral-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                                                        title="Verify"
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                    </button>
                                                    {user.accountStatus !== 'suspended' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'suspended')}
                                                            className="p-2 text-neutral-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                                                            title="Suspend"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {user.accountStatus === 'suspended' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'active')}
                                                            className="p-2 text-neutral-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                                                            title="Reactivate"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {user.accountStatus !== 'banned' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'banned')}
                                                            className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                            title="Ban"
                                                        >
                                                            <Ban className="w-4 h-4" />
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
