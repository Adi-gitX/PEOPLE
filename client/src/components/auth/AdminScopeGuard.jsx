import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export function AdminScopeGuard({ requiredScopes = [], children }) {
    const { isAuthenticated, role, user, adminAccess, refreshAdminAccess } = useAuthStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            if (!isAuthenticated || role !== 'admin') {
                if (mounted) setLoading(false);
                return;
            }

            if (!adminAccess && user?.uid) {
                try {
                    await refreshAdminAccess();
                } catch {
                    // handled below by access checks
                }
            }

            if (mounted) setLoading(false);
        };

        void load();

        return () => {
            mounted = false;
        };
    }, [adminAccess, isAuthenticated, refreshAdminAccess, role, user?.uid]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (role !== 'admin') {
        return <Navigate to="/dashboard/contributor" replace />;
    }

    if (!adminAccess) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">Admin Scopes Unavailable</h1>
                    <p className="text-zinc-400 mb-6">Unable to load your admin permissions right now.</p>
                    <Link
                        to="/admin"
                        className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-zinc-200 transition-colors"
                    >
                        Back to Admin
                    </Link>
                </div>
            </div>
        );
    }

    if (adminAccess.adminType !== 'super_admin' && requiredScopes.length > 0) {
        const scopeSet = new Set(adminAccess.scopes || []);
        const hasRequiredScope = requiredScopes.every((scope) => scopeSet.has(scope));
        if (!hasRequiredScope) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-4">Scope Restricted</h1>
                        <p className="text-zinc-400 mb-2">You do not have the required permissions for this admin area.</p>
                        <p className="text-xs text-zinc-500 mb-6">Required: {requiredScopes.join(' + ')}</p>
                        <Link
                            to="/admin"
                            className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-zinc-200 transition-colors"
                        >
                            Back to Admin
                        </Link>
                    </div>
                </div>
            );
        }
    }

    return children;
}

export default AdminScopeGuard;
