import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';

export function AdminGuard({ children }) {
    const { user, loading } = useAuthStore();

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-zinc-400 mb-6">You don't have permission to access the admin panel.</p>
                    <a
                        href="/dashboard"
                        className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-zinc-200 transition-colors"
                    >
                        Go to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return children;
}
