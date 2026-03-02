import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { EmailOtpForm } from '../components/auth/EmailOtpForm';
import { PublicLayout } from '../components/layout/PublicLayout';
import { KeyRound, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { getDefaultPathForRole } from '../lib/roleRouting';

export default function AuthPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, role, isLoading } = useAuthStore();

    const urlMode = searchParams.get('mode');
    const initialMode = urlMode === 'signup' || window.location.pathname === '/signup' ? 'signup' : 'login';

    const [mode, setMode] = useState(initialMode);
    const [authMethod, setAuthMethod] = useState('otp');

    useEffect(() => {
        if (!isLoading && isAuthenticated && role) {
            const dashboardPath = getDefaultPathForRole(role);
            navigate(dashboardPath, { replace: true });
        }
    }, [isAuthenticated, role, isLoading, navigate]);

    return (
        <PublicLayout showFooter={false}>
            <div className="flex-1 flex items-center justify-center px-6 py-20 min-h-[calc(100vh-4rem)]">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-4xl font-bold tracking-tight">
                            {mode === 'login' ? 'Welcome back' : 'Create Account'}
                        </h2>
                        <p className="text-muted-foreground">
                            {mode === 'login'
                                ? 'Sign in to access your account'
                                : 'Start automating your workflows today'}
                        </p>
                    </div>

                    {mode === 'login' ? (
                        <div className="flex bg-zinc-900 rounded-lg p-1">
                            <button
                                onClick={() => setAuthMethod('otp')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${authMethod === 'otp'
                                    ? 'bg-white text-black'
                                    : 'text-zinc-400 hover:text-white'
                                    }`}
                            >
                                <Sparkles className="w-4 h-4" />
                                Email OTP
                            </button>
                            <button
                                onClick={() => setAuthMethod('password')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${authMethod === 'password'
                                    ? 'bg-white text-black'
                                    : 'text-zinc-400 hover:text-white'
                                    }`}
                            >
                                <KeyRound className="w-4 h-4" />
                                Password
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/10 bg-zinc-900 text-sm text-zinc-300">
                            <Sparkles className="w-4 h-4" />
                            Email OTP (Magic Link) Signup
                        </div>
                    )}

                    <div>
                        {mode === 'signup' || authMethod === 'otp'
                            ? <EmailOtpForm mode={mode} />
                            : <LoginForm />}

                        <div className="mt-8 text-center text-sm">
                            <span className="text-muted-foreground">
                                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            </span>
                            <button
                                onClick={() => {
                                    const nextMode = mode === 'login' ? 'signup' : 'login';
                                    if (nextMode === 'signup') {
                                        setAuthMethod('otp');
                                    }
                                    setMode(nextMode);
                                }}
                                className="font-medium text-white hover:text-white/80 transition-colors"
                            >
                                {mode === 'login' ? 'Sign up' : 'Sign in'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
