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
            setUsers(response.users || []);
            setTotal(response.total || 0);
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
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">User Management</h1>
                        <p className="text-zinc-400 mt-1">{total} total users</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <input
                            type="text"
                            value={filter.search}
                            onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
                            placeholder="Search users..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                        />
                    </div>
                    <select
                        value={filter.role}
                        onChange={(e) => setFilter(f => ({ ...f, role: e.target.value }))}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white"
                    >
                        <option value="">All Roles</option>
                        <option value="contributor">Contributors</option>
                        <option value="initiator">Initiators</option>
                        <option value="admin">Admins</option>
                    </select>
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white"
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
                    <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No Users Found</h3>
                        <p className="text-zinc-400">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-zinc-800/50">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">User</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Role</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Joined</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {filteredUsers.map((user) => {
                                    const statusConfig = STATUS_CONFIG[user.accountStatus] || STATUS_CONFIG.active;
                                    const roleConfig = ROLE_CONFIG[user.primaryRole] || ROLE_CONFIG.contributor;

                                    return (
                                        <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-white font-medium">
                                                        {user.fullName?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{user.fullName || 'Unknown'}</p>
                                                        <p className="text-sm text-zinc-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`text-sm font-medium ${roleConfig.color}`}>
                                                    {roleConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-zinc-400">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleVerify(user.id)}
                                                        className="p-1.5 text-zinc-400 hover:text-green-500 transition-colors"
                                                        title="Verify"
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                    </button>
                                                    {user.accountStatus !== 'suspended' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'suspended')}
                                                            className="p-1.5 text-zinc-400 hover:text-yellow-500 transition-colors"
                                                            title="Suspend"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {user.accountStatus === 'suspended' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'active')}
                                                            className="p-1.5 text-zinc-400 hover:text-green-500 transition-colors"
                                                            title="Reactivate"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {user.accountStatus !== 'banned' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'banned')}
                                                            className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
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
