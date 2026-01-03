import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useEffect, useState } from 'react';

export const AuthGuard = ({ children, requireRole = null }) => {
    const { isAuthenticated, isLoading, role, refreshProfile } = useAuthStore();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // If authenticated but no role, try to refresh profile
        const checkRole = async () => {
            if (isAuthenticated && !role && !isLoading) {
                console.log('[AuthGuard] Authenticated but no role, refreshing profile...');
                try {
                    await refreshProfile();
                } catch (e) {
                    console.error('[AuthGuard] Failed to refresh profile:', e);
                }
            }
            setIsChecking(false);
        };

        if (!isLoading) {
            checkRole();
        }
    }, [isAuthenticated, role, isLoading, refreshProfile]);

    // Show loading while checking auth state
    if (isLoading || isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
                    <p className="text-zinc-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        console.log('[AuthGuard] Not authenticated, redirecting to login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Handle role requirements
    if (requireRole && role !== requireRole) {
        // If role is null (profile fetch failed), show error
        if (!role) {
            console.log('[AuthGuard] Role is null, showing error');
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

        // Redirect to correct dashboard based on role
        console.log('[AuthGuard] Role mismatch, redirecting. Required:', requireRole, 'Actual:', role);
        const redirectPath = role === 'initiator'
            ? '/dashboard/initiator'
            : '/dashboard/contributor';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export const GuestGuard = ({ children }) => {
    const { isAuthenticated, isLoading, role } = useAuthStore();

    // Show loading while checking auth state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    // If authenticated, redirect to dashboard
    if (isAuthenticated && role) {
        console.log('[GuestGuard] Already authenticated with role:', role, '- redirecting');
        const redirectPath = role === 'initiator'
            ? '/dashboard/initiator'
            : '/dashboard/contributor';
        return <Navigate to={redirectPath} replace />;
    }

    // If authenticated but no role, allow through (might be completing signup)
    if (isAuthenticated && !role) {
        console.log('[GuestGuard] Authenticated but no role, allowing through');
    }

    return children;
};

export default AuthGuard;
