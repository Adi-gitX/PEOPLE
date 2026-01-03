import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, User, Briefcase, Code, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

const ACTION_CODE_SETTINGS = {
    url: window.location.origin + '/login?emailLink=true',
    handleCodeInApp: true,
};

export function EmailOtpForm({ mode = 'login' }) {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState('email');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        role: 'contributor',
    });
    const navigate = useNavigate();
    const processedRef = useRef(false);
    const { setAuthState } = useAuthStore();

    useEffect(() => {
        const handleEmailLink = async () => {
            if (processedRef.current) return;
            if (!isSignInWithEmailLink(auth, window.location.href)) return;

            processedRef.current = true;
            setIsLoading(true);

            let storedEmail = window.localStorage.getItem('emailForSignIn');

            if (!storedEmail) {
                storedEmail = window.prompt('Please enter your email to confirm:');
            }

            if (!storedEmail) {
                toast.error('Email is required to complete sign-in');
                setIsLoading(false);
                processedRef.current = false;
                return;
            }

            try {
                const result = await signInWithEmailLink(auth, storedEmail, window.location.href);
                window.localStorage.removeItem('emailForSignIn');

                await result.user.getIdToken(true);
                await new Promise(r => setTimeout(r, 500));

                try {
                    const response = await api.get('/api/v1/users/me');
                    const userData = response.data;

                    setAuthState(
                        {
                            uid: result.user.uid,
                            email: result.user.email,
                            displayName: result.user.displayName,
                            photoURL: result.user.photoURL,
                        },
                        userData?.profile || null,
                        userData?.user?.primaryRole || 'contributor'
                    );

                    toast.success('Welcome back!');
                    window.history.replaceState({}, document.title, '/login');

                    const dashboardPath = userData?.user?.primaryRole === 'initiator'
                        ? '/dashboard/initiator'
                        : '/dashboard/contributor';

                    navigate(dashboardPath, { replace: true });

                } catch {
                    const storedRole = window.localStorage.getItem('signupRole') || 'contributor';
                    const storedName = window.localStorage.getItem('signupName') || result.user.displayName || 'User';

                    try {
                        const registerResponse = await api.post('/api/v1/users/register', {
                            email: storedEmail,
                            fullName: storedName,
                            role: storedRole,
                        });

                        window.localStorage.removeItem('signupRole');
                        window.localStorage.removeItem('signupName');

                        setAuthState(
                            {
                                uid: result.user.uid,
                                email: result.user.email,
                                displayName: result.user.displayName || storedName,
                                photoURL: result.user.photoURL,
                            },
                            registerResponse.data?.profile || null,
                            storedRole
                        );

                        toast.success('Account created successfully!');
                        window.history.replaceState({}, document.title, '/login');

                        const dashboardPath = storedRole === 'initiator'
                            ? '/dashboard/initiator'
                            : '/dashboard/contributor';

                        navigate(dashboardPath, { replace: true });

                    } catch {
                        toast.error('Failed to create account. Please try again.');
                        setIsLoading(false);
                        processedRef.current = false;
                    }
                }
            } catch (error) {
                toast.error(error.message || 'Failed to sign in');
                setIsLoading(false);
                processedRef.current = false;
                window.history.replaceState({}, document.title, '/login');
            }
        };

        handleEmailLink();
    }, [navigate, setAuthState]);

    const handleSendLink = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (mode === 'signup' && !formData.fullName.trim()) {
            toast.error('Please enter your full name');
            return;
        }

        setIsLoading(true);
        try {
            window.localStorage.setItem('emailForSignIn', email);

            if (mode === 'signup') {
                window.localStorage.setItem('signupRole', formData.role);
                window.localStorage.setItem('signupName', formData.fullName || 'User');
            }

            await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS);

            setStep('sent');
            toast.success('Sign-in link sent to your email!');
        } catch (error) {
            if (error.code === 'auth/invalid-email') {
                toast.error('Invalid email address');
            } else if (error.code === 'auth/too-many-requests') {
                toast.error('Too many requests. Please try again later.');
            } else {
                toast.error(error.message || 'Failed to send sign-in link');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && isSignInWithEmailLink(auth, window.location.href)) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <p className="text-zinc-400">Signing you in...</p>
            </div>
        );
    }

    if (step === 'sent') {
        return (
            <div className="space-y-6 text-center py-8">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">Check your email</h3>
                    <p className="text-zinc-400">
                        We sent a sign-in link to
                    </p>
                    <p className="text-white font-medium">{email}</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-400">
                    <p>Click the link in the email to sign in. The link expires in 1 hour.</p>
                </div>

                <div className="pt-4">
                    <button
                        type="button"
                        onClick={() => {
                            setStep('email');
                            setEmail('');
                        }}
                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        Use a different email
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSendLink} className="space-y-4">
                {mode === 'signup' && (
                    <>
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
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                    className="flex h-10 w-full rounded-md border border-white/10 bg-black pl-10 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20"
                                />
                            </div>
                        </div>
                    </>
                )}

                <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            className="flex h-10 w-full rounded-md border border-white/10 bg-black pl-10 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                    </div>
                    <p className="text-xs text-zinc-500 ml-1">
                        We'll send you a magic link to sign in
                    </p>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-white text-black hover:bg-white/90 font-semibold h-10"
                    disabled={isLoading || !email}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            Send Magic Link <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
