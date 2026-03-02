import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';

class AppErrorBoundaryInternal extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('AppErrorBoundary caught runtime error', error, info);
    }

    handleResetSession = async () => {
        try {
            await useAuthStore.getState().logout();
        } finally {
            window.location.assign('/login');
        }
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <div className="max-w-lg w-full border border-white/10 rounded-2xl bg-[#0A0A0A] p-8 space-y-4">
                    <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
                    <p className="text-zinc-400">
                        The app hit an unexpected error. Reset your session and sign in again.
                    </p>
                    <button
                        type="button"
                        onClick={this.handleResetSession}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
                    >
                        Reset session and go to login
                    </button>
                </div>
            </div>
        );
    }
}

export function AppErrorBoundary({ children }) {
    return <AppErrorBoundaryInternal>{children}</AppErrorBoundaryInternal>;
}

export default AppErrorBoundary;
