import { useEffect, useState } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';
import { getDefaultPathForRole } from '../../lib/roleRouting';

export function AdminGuard({ children }) {
    const { user, isAuthenticated, isLoading, role, adminAccess, refreshProfile, refreshAdminAccess } = useAuthStore();
    const [checkingRole, setCheckingRole] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const ensureRole = async () => {
            if (!isLoading && isAuthenticated && !role) {
                try {
                    await refreshProfile();
                } catch {
                    // Silent fail, handled by role check below
                }
            }
            if (!isLoading && isAuthenticated && (role === 'admin' || (!role && user?.uid))) {
                try {
                    await refreshAdminAccess();
                } catch {
                    // Scope details will be handled by page-level checks
                }
            }
            setCheckingRole(false);
        };

        if (!isLoading) {
            ensureRole();
        }
    }, [isAuthenticated, isLoading, role, user?.uid, refreshProfile, refreshAdminAccess]);

    if (isLoading || checkingRole) {
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
        const fallbackPath = getDefaultPathForRole(role);
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-zinc-400 mb-6">You don't have permission to access the admin panel.</p>
                    <Link
                        to={fallbackPath}
                        className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-zinc-200 transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (!adminAccess) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">Admin Access Unavailable</h1>
                    <p className="text-zinc-400 mb-6">Your account does not have an active admin profile.</p>
                    <Link
                        to="/dashboard/contributor"
                        className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-zinc-200 transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (
        adminAccess?.mfaRequired
        && adminAccess?.mfaEnforcementMode === 'enforce'
        && !adminAccess?.mfaSatisfied
        && location.pathname !== '/admin/security'
    ) {
        return <Navigate to="/admin/security" replace />;
    }

    if (adminAccess && adminAccess.isActive === false) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">Admin Access Disabled</h1>
                    <p className="text-zinc-400 mb-6">Your admin account is currently inactive.</p>
                    <Link
                        to="/dashboard/contributor"
                        className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-zinc-200 transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return children;
}
