import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const AuthGuard = ({ children, requireRole = null }) => {
    const { isAuthenticated, isLoading, role } = useAuthStore();
    const location = useLocation();

    if (isLoading) {
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

    if (requireRole && role !== requireRole) {
        const redirectPath = role === 'initiator'
            ? '/dashboard/initiator'
            : '/dashboard/contributor';
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

    if (isAuthenticated) {
        const redirectPath = role === 'initiator'
            ? '/dashboard/initiator'
            : '/dashboard/contributor';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default AuthGuard;
