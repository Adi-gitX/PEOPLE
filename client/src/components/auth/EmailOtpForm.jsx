import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, User, Briefcase, Code, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { getDefaultPathForRole } from '../../lib/roleRouting';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailOtpForm({ mode = 'login' }) {
    const navigate = useNavigate();
    const { refreshProfile } = useAuthStore();

    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [rolePreference, setRolePreference] = useState('contributor');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('email');
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resendIn, setResendIn] = useState(0);
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (resendIn <= 0) return undefined;
        const timer = window.setInterval(() => {
            setResendIn((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [resendIn]);

    const clearFieldError = (field) => {
        setFieldErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const validateEmailStep = () => {
        const errors = {};
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            errors.email = 'Email is required';
        } else if (!EMAIL_REGEX.test(normalizedEmail)) {
            errors.email = 'Enter a valid email address';
        }

        if (mode === 'signup' && !fullName.trim()) {
            errors.fullName = 'Full name is required';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateOtpStep = () => {
        const errors = {};
        const normalizedOtp = otp.trim();
        if (normalizedOtp.length !== OTP_LENGTH) {
            errors.otp = `Enter the ${OTP_LENGTH}-digit code`;
        } else if (!/^\d+$/.test(normalizedOtp)) {
            errors.otp = 'Code should contain numbers only';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const baseSendPayload = useMemo(() => ({
        email: email.trim().toLowerCase(),
        mode,
        fullName: mode === 'signup' ? fullName.trim() : undefined,
        rolePreference: mode === 'signup' ? rolePreference : undefined,
        locale: typeof navigator !== 'undefined' ? navigator.language : undefined,
        clientMeta: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : undefined,
        },
    }), [email, fullName, mode, rolePreference]);

    const sendOtp = async ({ silent = false } = {}) => {
        if (!silent && !validateEmailStep()) return;

        setSending(true);
        try {
            const response = await api.post('/api/v1/auth/otp/send', baseSendPayload);
            const expiresInSeconds = response.data?.expiresInSeconds || RESEND_SECONDS;
            setStep('verify');
            setResendIn(Math.min(Math.max(expiresInSeconds / 2, RESEND_SECONDS), 90));
            if (!silent) {
                toast.success('Verification code sent. Check your inbox.');
            }
            setFieldErrors({});
        } catch (error) {
            toast.error(error.message || 'Failed to send verification code');
        } finally {
            setSending(false);
        }
    };

    const completeSignIn = async (customToken) => {
        await signInWithCustomToken(auth, customToken);
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        const profileData = await refreshProfile();
        const resolvedRole = profileData?.activeRole || profileData?.user?.primaryRole || 'contributor';
        navigate(getDefaultPathForRole(resolvedRole), { replace: true });
    };

    const handleVerify = async (event) => {
        event.preventDefault();
        if (!validateOtpStep()) return;

        setVerifying(true);
        try {
            const response = await api.post('/api/v1/auth/otp/verify', {
                email: email.trim().toLowerCase(),
                otp: otp.trim(),
                mode,
                fullName: mode === 'signup' ? fullName.trim() : undefined,
                rolePreference: mode === 'signup' ? rolePreference : undefined,
            });

            const token = response.data?.customToken;
            if (!token) {
                throw new Error('Authentication token missing in response');
            }

            await completeSignIn(token);
            toast.success(mode === 'signup' ? 'Account created successfully' : 'Signed in successfully');
        } catch (error) {
            setFieldErrors((prev) => ({ ...prev, otp: error.message || 'Invalid verification code' }));
            toast.error(error.message || 'Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    const onSubmitEmail = async (event) => {
        event.preventDefault();
        await sendOtp();
    };

    return (
        <div className="space-y-6">
            {step === 'email' && (
                <form onSubmit={onSubmitEmail} className="space-y-4">
                    {mode === 'signup' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground ml-1">Start with...</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRolePreference('contributor')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                                            rolePreference === 'contributor'
                                                ? 'border-white bg-white/5'
                                                : 'border-white/10 hover:border-white/30'
                                        }`}
                                    >
                                        <Code className={`h-5 w-5 ${rolePreference === 'contributor' ? 'text-white' : 'text-zinc-500'}`} />
                                        <span className={`text-sm font-medium ${rolePreference === 'contributor' ? 'text-white' : 'text-zinc-400'}`}>
                                            Build & Earn
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRolePreference('initiator')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                                            rolePreference === 'initiator'
                                                ? 'border-white bg-white/5'
                                                : 'border-white/10 hover:border-white/30'
                                        }`}
                                    >
                                        <Briefcase className={`h-5 w-5 ${rolePreference === 'initiator' ? 'text-white' : 'text-zinc-500'}`} />
                                        <span className={`text-sm font-medium ${rolePreference === 'initiator' ? 'text-white' : 'text-zinc-400'}`}>
                                            Post Missions
                                        </span>
                                    </button>
                                </div>
                                <p className="text-[10px] text-zinc-500 ml-1">Contributor and initiator workspaces will both be enabled.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(event) => {
                                            setFullName(event.target.value);
                                            clearFieldError('fullName');
                                        }}
                                        placeholder="John Doe"
                                        required
                                        className="flex h-10 w-full rounded-md border border-white/10 bg-black pl-10 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20"
                                    />
                                </div>
                                {fieldErrors.fullName && <p className="text-xs text-red-400 ml-1">{fieldErrors.fullName}</p>}
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
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                    clearFieldError('email');
                                }}
                                placeholder="name@example.com"
                                required
                                className="flex h-10 w-full rounded-md border border-white/10 bg-black pl-10 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20"
                            />
                        </div>
                        {fieldErrors.email && <p className="text-xs text-red-400 ml-1">{fieldErrors.email}</p>}
                        <p className="text-xs text-zinc-500 ml-1">
                            We send a secure 6-digit verification code.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-white text-black hover:bg-white/90 font-semibold h-10"
                        disabled={sending}
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Code <ArrowRight className="w-4 h-4 ml-2" /></>}
                    </Button>
                </form>
            )}

            {step === 'verify' && (
                <form onSubmit={handleVerify} className="space-y-4">
                    <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-300 mb-2">
                            <ShieldCheck className="w-4 h-4" />
                            Verification code sent to
                        </div>
                        <p className="text-sm text-white font-medium break-all">{email.trim().toLowerCase()}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Enter 6-digit code</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={OTP_LENGTH}
                            value={otp}
                            onChange={(event) => {
                                const cleaned = event.target.value.replace(/[^\d]/g, '').slice(0, OTP_LENGTH);
                                setOtp(cleaned);
                                clearFieldError('otp');
                            }}
                            placeholder="123456"
                            className="flex h-11 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-lg tracking-[0.3em] text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                        {fieldErrors.otp && <p className="text-xs text-red-400 ml-1">{fieldErrors.otp}</p>}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <button
                            type="button"
                            onClick={() => {
                                setStep('email');
                                setOtp('');
                                setFieldErrors({});
                            }}
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            Change email
                        </button>
                        <button
                            type="button"
                            disabled={sending || resendIn > 0}
                            onClick={() => sendOtp({ silent: false })}
                            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                        </button>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-white text-black hover:bg-white/90 font-semibold h-10"
                        disabled={verifying || otp.trim().length !== OTP_LENGTH}
                    >
                        {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Continue'}
                    </Button>
                </form>
            )}
        </div>
    );
}

export default EmailOtpForm;
