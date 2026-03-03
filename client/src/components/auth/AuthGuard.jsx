import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useEffect, useRef, useState } from 'react';
import { getDefaultPathForRole } from '../../lib/roleRouting';
import { useRoleCapabilities } from '../../hooks/useApi';

export const AuthGuard = ({ children, requireRole = null }) => {
    const { isAuthenticated, isLoading, role, user, refreshProfile, switchActiveRole } = useAuthStore();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const [isSyncingRole, setIsSyncingRole] = useState(false);
    const [roleSyncFailed, setRoleSyncFailed] = useState(false);
    const roleSyncAttemptRef = useRef('');
    const { data: capabilityData, loading: capabilityLoading } = useRoleCapabilities({
        immediate: Boolean(isAuthenticated && !isLoading),
        deps: [user?.uid, role, requireRole],
        resetOnFetch: true,
    });

    useEffect(() => {
        const checkRole = async () => {
            if (isAuthenticated && !role && !isLoading) {
                try {
                    await refreshProfile();
                } catch {
                    // Silent fail
                }
            }
            setIsChecking(false);
        };

        if (!isLoading) {
            checkRole();
        }
    }, [isAuthenticated, role, isLoading, refreshProfile]);

    useEffect(() => {
        const syncRequiredRole = async () => {
            if (!isAuthenticated || isLoading || !requireRole) return;
            if (requireRole === 'admin') return;
            if (role === requireRole) {
                setRoleSyncFailed(false);
                setIsSyncingRole(false);
                return;
            }
            if (capabilityLoading) return;

            const availableRoles = Array.isArray(capabilityData?.availableRoles) && capabilityData.availableRoles.length > 0
                ? capabilityData.availableRoles
                : role
                    ? [role]
                    : [];
            if (!availableRoles.includes(requireRole)) return;

            const syncKey = `${user?.uid || 'unknown'}:${role || 'none'}:${requireRole}`;
            if (roleSyncAttemptRef.current === syncKey) return;
            roleSyncAttemptRef.current = syncKey;

            setIsSyncingRole(true);
            setRoleSyncFailed(false);
            try {
                await switchActiveRole(requireRole);
            } catch {
                setRoleSyncFailed(true);
            } finally {
                setIsSyncingRole(false);
            }
        };

        syncRequiredRole();
    }, [
        isAuthenticated,
        isLoading,
        requireRole,
        role,
        capabilityLoading,
        capabilityData?.availableRoles,
        switchActiveRole,
        user?.uid,
    ]);

    if (isLoading || isChecking || isSyncingRole) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
                    <p className="text-zinc-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const availableRoles = Array.isArray(capabilityData?.availableRoles) && capabilityData.availableRoles.length > 0
        ? capabilityData.availableRoles
        : role
            ? [role]
            : [];
    const hasRequiredRoleCapability = requireRole ? availableRoles.includes(requireRole) : true;
    const requiresCapabilityResolution = Boolean(
        requireRole &&
        !isSyncingRole &&
        !roleSyncFailed &&
        (role !== requireRole || !role) &&
        capabilityLoading
    );

    if (requiresCapabilityResolution) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
                    <p className="text-zinc-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (requireRole && role !== requireRole) {
        if (hasRequiredRoleCapability) {
            if (roleSyncFailed) {
                const redirectPath = getDefaultPathForRole(role);
                return <Navigate to={redirectPath} replace />;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-black">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
                        <p className="text-zinc-500 text-sm">Switching workspace...</p>
                    </div>
                </div>
            );
        }

        if (!role) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
                    <div className="max-w-md text-center space-y-4">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold">Profile Error</h2>
                        <p className="text-zinc-400">
                            We couldn't verify your account role. Please try logging in again.
                        </p>
                        <button
                            onClick={() => {
                                useAuthStore.getState().logout();
                                window.location.href = '/login';
                            }}
                            className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-zinc-200 transition-colors"
                        >
                            Return to Login
                        </button>
                    </div>
                </div>
            );
        }

        const redirectPath = getDefaultPathForRole(role);
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export const GuestGuard = ({ children }) => {
    const { isAuthenticated, isLoading, role } = useAuthStore();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    if (isAuthenticated && role) {
        const redirectPath = getDefaultPathForRole(role);
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default AuthGuard;
