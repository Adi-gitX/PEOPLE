import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { ArrowLeft, Plus, RefreshCcw, ShieldCheck, ShieldAlert, UserCog, Search } from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_TYPES = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'support_admin', label: 'Support Admin' },
    { value: 'ops_admin', label: 'Ops Admin' },
    { value: 'trust_safety', label: 'Trust & Safety' },
];

const normalizeErrorMessage = (error, fallback) => error?.message || error?.error || fallback;

export default function AdminAdminsPage() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState('');
    const [filters, setFilters] = useState({
        q: '',
        adminType: '',
        isActive: '',
    });
    const [createForm, setCreateForm] = useState({
        uid: '',
        email: '',
        adminType: 'ops_admin',
        mfaRequired: true,
    });

    const fetchAdmins = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.q.trim()) params.set('q', filters.q.trim());
            if (filters.adminType) params.set('adminType', filters.adminType);
            if (filters.isActive) params.set('isActive', filters.isActive === 'active' ? 'true' : 'false');
            const queryString = params.toString();
            const endpoint = queryString
                ? `/api/v1/admin/admin-users?${queryString}`
                : '/api/v1/admin/admin-users';
            const response = await api.get(endpoint);
            setAdmins(response.data?.admins || []);
        } catch (error) {
            toast.error(normalizeErrorMessage(error, 'Failed to load admin users'));
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const handleCreateAdmin = async (event) => {
        event.preventDefault();
        if (!createForm.uid.trim() && !createForm.email.trim()) {
            toast.error('Provide either a user UID or email');
            return;
        }

        setSavingKey('create-admin');
        try {
            await api.post('/api/v1/admin/admin-users', {
                uid: createForm.uid.trim() || undefined,
                email: createForm.email.trim() || undefined,
                adminType: createForm.adminType,
                mfaRequired: createForm.mfaRequired,
            });
            toast.success('Admin user created');
            setCreateForm({
                uid: '',
                email: '',
                adminType: 'ops_admin',
                mfaRequired: true,
            });
            await fetchAdmins();
        } catch (error) {
            toast.error(normalizeErrorMessage(error, 'Failed to create admin user'));
        } finally {
            setSavingKey('');
        }
    };

    const handleToggleActive = async (row) => {
        const actionLabel = row.isActive ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${actionLabel} ${row.fullName || row.uid}?`)) return;

        setSavingKey(`${row.uid}:active`);
        try {
            await api.patch(`/api/v1/admin/admin-users/${row.uid}`, {
                isActive: !row.isActive,
            });
            toast.success('Admin status updated');
            await fetchAdmins();
        } catch (error) {
            toast.error(normalizeErrorMessage(error, 'Failed to update admin status'));
        } finally {
            setSavingKey('');
        }
    };

    const handleTypeChange = async (row, adminType) => {
        if (adminType === row.adminType) return;
        const confirmed = window.confirm(`Change ${row.fullName || row.uid} to ${adminType.replace('_', ' ')}?`);
        if (!confirmed) return;

        setSavingKey(`${row.uid}:type`);
        try {
            await api.patch(`/api/v1/admin/admin-users/${row.uid}`, {
                adminType,
            });
            toast.success('Admin type updated');
            await fetchAdmins();
        } catch (error) {
            toast.error(normalizeErrorMessage(error, 'Failed to update admin type'));
        } finally {
            setSavingKey('');
        }
    };

    const handleMfaRequirement = async (row) => {
        setSavingKey(`${row.uid}:mfa-required`);
        try {
            await api.patch(`/api/v1/admin/admin-users/${row.uid}`, {
                mfaRequired: !row.mfaRequired,
            });
            toast.success('MFA requirement updated');
            await fetchAdmins();
        } catch (error) {
            toast.error(normalizeErrorMessage(error, 'Failed to update MFA requirement'));
        } finally {
            setSavingKey('');
        }
    };

    const handleResetMfa = async (row) => {
        const reason = window.prompt(`Enter a reason for resetting MFA for ${row.fullName || row.uid}:`);
        if (reason === null) return;
        if (!reason.trim()) {
            toast.error('Reason is required');
            return;
        }

        setSavingKey(`${row.uid}:mfa-reset`);
        try {
            await api.post(`/api/v1/admin/admin-users/${row.uid}/mfa-reset`, {
                reason: reason.trim(),
            });
            toast.success('Admin MFA reset completed');
            await fetchAdmins();
        } catch (error) {
            toast.error(normalizeErrorMessage(error, 'Failed to reset admin MFA'));
        } finally {
            setSavingKey('');
        }
    };

    const filteredCount = useMemo(() => admins.length, [admins]);

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
                </Link>

                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter text-white">Admin Governance</h1>
                        <p className="text-neutral-400 mt-1">{filteredCount} admin accounts</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchAdmins}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-sm text-neutral-300 hover:bg-white/5"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                <form onSubmit={handleCreateAdmin} className="grid md:grid-cols-5 gap-3 mb-6 p-4 border border-white/10 rounded-xl bg-[#0A0A0A]">
                    <input
                        type="text"
                        value={createForm.uid}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, uid: event.target.value }))}
                        placeholder="User UID"
                        className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600"
                    />
                    <input
                        type="email"
                        value={createForm.email}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="or user email"
                        className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600"
                    />
                    <select
                        value={createForm.adminType}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, adminType: event.target.value }))}
                        className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                        {ADMIN_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                    <label className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg text-sm text-neutral-300">
                        <input
                            type="checkbox"
                            checked={createForm.mfaRequired}
                            onChange={(event) => setCreateForm((prev) => ({ ...prev, mfaRequired: event.target.checked }))}
                        />
                        Require MFA
                    </label>
                    <button
                        type="submit"
                        disabled={savingKey === 'create-admin'}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white text-black text-sm font-semibold disabled:opacity-60"
                    >
                        <Plus className="w-4 h-4" />
                        Create Admin
                    </button>
                </form>

                <div className="grid md:grid-cols-3 gap-3 mb-6">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-600" />
                        <input
                            type="text"
                            value={filters.q}
                            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
                            placeholder="Search by name/email/uid"
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white"
                        />
                    </div>
                    <select
                        value={filters.adminType}
                        onChange={(event) => setFilters((prev) => ({ ...prev, adminType: event.target.value }))}
                        className="bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                        <option value="">All Admin Types</option>
                        {ADMIN_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                    <select
                        value={filters.isActive}
                        onChange={(event) => setFilters((prev) => ({ ...prev, isActive: event.target.value }))}
                        className="bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {loading ? (
                    <div className="text-neutral-400 text-sm">Loading admin accounts...</div>
                ) : admins.length === 0 ? (
                    <div className="border border-white/10 rounded-xl bg-[#0A0A0A] p-8 text-center">
                        <UserCog className="w-8 h-8 mx-auto mb-3 text-neutral-500" />
                        <p className="text-neutral-300">No admin accounts match your filters.</p>
                    </div>
                ) : (
                    <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0A0A0A]">
                        <table className="w-full">
                            <thead className="bg-black/40 border-b border-white/10">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs text-neutral-500 uppercase">Admin</th>
                                    <th className="text-left px-4 py-3 text-xs text-neutral-500 uppercase">Type</th>
                                    <th className="text-left px-4 py-3 text-xs text-neutral-500 uppercase">Security</th>
                                    <th className="text-right px-4 py-3 text-xs text-neutral-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {admins.map((row) => {
                                    const rowBusy = savingKey.startsWith(`${row.uid}:`);
                                    return (
                                        <tr key={row.uid} className="hover:bg-white/[0.02]">
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-white">{row.fullName || 'Admin User'}</p>
                                                <p className="text-xs text-neutral-500">{row.email || row.uid}</p>
                                                <p className="text-[11px] text-neutral-600 mt-1">{row.uid}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <select
                                                    value={row.adminType}
                                                    disabled={rowBusy}
                                                    onChange={(event) => handleTypeChange(row, event.target.value)}
                                                    className="bg-black border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white"
                                                >
                                                    {ADMIN_TYPES.map((type) => (
                                                        <option key={type.value} value={type.value}>{type.label}</option>
                                                    ))}
                                                </select>
                                                <p className={`text-xs mt-2 ${row.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                                    {row.isActive ? 'Active' : 'Inactive'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-1 text-xs">
                                                    <p className="text-neutral-400">
                                                        MFA required: <span className="text-white">{row.mfaRequired ? 'Yes' : 'No'}</span>
                                                    </p>
                                                    <p className="text-neutral-400">
                                                        Enrolled: <span className="text-white">{row.mfaEnrolled ? 'Yes' : 'No'}</span>
                                                    </p>
                                                    <p className="text-neutral-500">
                                                        Last reset: {row.lastMfaResetAt ? new Date(row.lastMfaResetAt).toLocaleString() : 'Never'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={rowBusy}
                                                        onClick={() => handleToggleActive(row)}
                                                        className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-neutral-300 hover:bg-white/5 disabled:opacity-60"
                                                    >
                                                        {row.isActive ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={rowBusy}
                                                        onClick={() => handleMfaRequirement(row)}
                                                        className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-neutral-300 hover:bg-white/5 disabled:opacity-60 inline-flex items-center gap-1"
                                                    >
                                                        {row.mfaRequired ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                                        {row.mfaRequired ? 'Unrequire MFA' : 'Require MFA'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={rowBusy}
                                                        onClick={() => handleResetMfa(row)}
                                                        className="px-3 py-1.5 rounded-lg border border-amber-500/30 text-xs text-amber-300 hover:bg-amber-500/10 disabled:opacity-60"
                                                    >
                                                        Reset MFA
                                                    </button>
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
