import { useState } from 'react';
import { Button } from '../ui/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn, signInWithGoogle, resetPassword } from '../../lib/auth';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshProfile } = useAuthStore();

    const from = location.state?.from?.pathname || '/dashboard';

    const getErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                return 'Invalid email or password. Please check your credentials.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/user-disabled':
                return 'This account has been disabled. Contact support.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later or reset your password.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection.';
            default:
                return 'Login failed. Please try again.';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await signIn(email, password);
            await new Promise(r => setTimeout(r, 300));

            const userData = await refreshProfile();
            const role = userData?.user?.primaryRole;

            toast.success('Welcome back!');

            const dashboardPath = role === 'initiator'
                ? '/dashboard/initiator'
                : '/dashboard/contributor';

            navigate(dashboardPath, { replace: true });
        } catch (error) {
            const message = getErrorMessage(error.code);
            toast.error(message);

            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                setShowForgotPassword(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            toast.error('Please enter your email first');
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword(email);
            toast.success('Password reset email sent! Check your inbox.');
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                toast.error('No account found with this email.');
            } else {
                toast.error('Failed to send reset email. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
            await new Promise(r => setTimeout(r, 500));

            const userData = await refreshProfile();
            const role = userData?.user?.primaryRole;

            toast.success('Welcome!');

            const dashboardPath = role === 'initiator'
                ? '/dashboard/initiator'
                : '/dashboard/contributor';

            navigate(dashboardPath, { replace: true });
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                toast.info('Sign-in cancelled');
            } else {
                toast.error(error.message || 'Failed to sign in with Google');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground ml-1">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="flex h-10 w-full rounded-md border border-white/10 bg-black pl-10 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all hover:border-white/20"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-medium text-muted-foreground">Password</label>
                    <button
                        type="button"
                        onClick={handleForgotPassword}
                        className={`text-xs transition-colors ${showForgotPassword ? 'text-white' : 'text-muted-foreground hover:text-white'}`}
                    >
                        Forgot password?
                    </button>
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="flex h-10 w-full rounded-md border border-white/10 bg-black pl-10 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all hover:border-white/20"
                    />
                </div>
            </div>

            {showForgotPassword && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-400">
                    <p>Can't remember your password? Click "Forgot password?" above to reset it.</p>
                </div>
            )}

            <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-white/90 font-semibold h-10 mt-2"
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In'}
            </Button>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-black text-zinc-500">or continue with</span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-md border border-white/10 bg-black text-white text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
            >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
            </button>
        </form>
    );
}
