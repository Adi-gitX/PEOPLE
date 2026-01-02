import { useState } from 'react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { signUp, signInWithGoogle } from '../../lib/auth';
import { User, Mail, Lock, Briefcase, Code, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function SignupForm() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'contributor',
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const getErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'This email is already registered. Try logging in instead.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/operation-not-allowed':
                return 'Email/password signup is not enabled. Contact support.';
            case 'auth/weak-password':
                return 'Password is too weak. Use at least 6 characters.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection.';
            default:
                return 'Signup failed. Please try again.';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await signUp(
                formData.email,
                formData.password,
                formData.fullName,
                formData.role
            );
            toast.success('Account created successfully!');
            navigate(`/dashboard/${formData.role}`);
        } catch (error) {
            console.error('Signup error:', error);
            const message = getErrorMessage(error.code);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle(formData.role);
            toast.success('Welcome!');
            navigate(`/dashboard/${formData.role}`);
        } catch (error) {
            console.error('Google signup error:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                toast.info('Sign-up cancelled');
            } else if (error.code === 'auth/popup-blocked') {
                toast.error('Pop-up blocked. Please allow pop-ups for this site.');
            } else {
                toast.error(error.message || 'Failed to sign up with Google');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground ml-1">I want to...</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'contributor' })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${formData.role === 'contributor'
                            ? 'border-white bg-white/5'
                            : 'border-white/10 hover:border-white/30'
                            }`}
                    >
                        <Code className={`h-5 w-5 ${formData.role === 'contributor' ? 'text-white' : 'text-zinc-500'}`} />
                        <span className={`text-sm font-medium ${formData.role === 'contributor' ? 'text-white' : 'text-zinc-400'}`}>
                            Build & Earn
                        </span>
                        <span className="text-[10px] text-zinc-500">Contributor</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'initiator' })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${formData.role === 'initiator'
                            ? 'border-white bg-white/5'
                            : 'border-white/10 hover:border-white/30'
                            }`}
                    >
                        <Briefcase className={`h-5 w-5 ${formData.role === 'initiator' ? 'text-white' : 'text-zinc-500'}`} />
                        <span className={`text-sm font-medium ${formData.role === 'initiator' ? 'text-white' : 'text-zinc-400'}`}>
                            Post Missions
                        </span>
                        <span className="text-[10px] text-zinc-500">Initiator</span>
                    </button>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground ml-1">Full Name</label>
                <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        required
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="flex h-10 w-full rounded-md border border-white/10 bg-black pl-10 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all hover:border-white/20"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground ml-1">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        className="flex h-10 w-full rounded-md border border-white/10 bg-black pl-10 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all hover:border-white/20"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground ml-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        required
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••••••"
                        minLength={6}
                        className="flex h-10 w-full rounded-md border border-white/10 bg-black pl-10 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all hover:border-white/20"
                    />
                </div>
                <p className="text-[10px] text-muted-foreground ml-1">At least 6 characters</p>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground ml-1">Confirm Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        required
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••••••"
                        className="flex h-10 w-full rounded-md border border-white/10 bg-black pl-10 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all hover:border-white/20"
                    />
                </div>
            </div>

            <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-white/90 font-semibold h-10 mt-2"
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
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
                onClick={handleGoogleSignup}
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

            <p className="text-[10px] text-center text-zinc-500 mt-4">
                By creating an account, you agree to our{' '}
                <a href="/terms" className="underline hover:text-white">Terms of Service</a> and{' '}
                <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>
            </p>
        </form>
    );
}
