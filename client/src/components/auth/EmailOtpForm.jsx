import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, User, Briefcase, Code } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export function EmailOtpForm({ mode = 'login' }) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [step, setStep] = useState('email'); // 'email', 'otp', or 'details'
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [formData, setFormData] = useState({
        fullName: '',
        role: 'contributor',
    });
    const navigate = useNavigate();
    const otpRefs = useRef([]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendOTP = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/api/v1/auth/otp/send', { email });
            setStep('otp');
            setCountdown(60);
            toast.success('Verification code sent to your email!');
        } catch (error) {
            console.error('Send OTP error:', error);
            toast.error(error.message || 'Failed to send verification code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOTPChange = (index, value) => {
        if (value.length > 1) {
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (index + i < 6) newOtp[index + i] = digit;
            });
            setOtp(newOtp);
            const nextIndex = Math.min(index + digits.length, 5);
            otpRefs.current[nextIndex]?.focus();
        } else {
            const newOtp = [...otp];
            newOtp[index] = value.replace(/\D/g, '');
            setOtp(newOtp);

            if (value && index < 5) {
                otpRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            toast.error('Please enter the complete verification code');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/api/v1/auth/otp/verify', {
                email,
                otp: otpCode,
                fullName: formData.fullName || undefined,
                role: formData.role || undefined,
            });

            // Sign in with custom token
            await signInWithCustomToken(auth, response.customToken);

            toast.success('Welcome!');
            navigate(`/dashboard/${response.profile?.userId ? 'contributor' : formData.role}`);
        } catch (error) {
            console.error('Verify OTP error:', error);
            toast.error(error.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setIsLoading(true);
        try {
            await api.post('/api/v1/auth/otp/send', { email });
            setCountdown(60);
            setOtp(['', '', '', '', '', '']);
            toast.success('New code sent!');
        } catch (error) {
            toast.error(error.message || 'Failed to resend code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {step === 'email' ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
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
                            We'll send you a one-time verification code
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
                                Send Code <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="text-center">
                        <p className="text-sm text-zinc-400 mb-2">
                            Enter the 6-digit code sent to
                        </p>
                        <p className="text-white font-medium">{email}</p>
                        <button
                            type="button"
                            onClick={() => setStep('email')}
                            className="text-xs text-zinc-500 hover:text-white mt-1"
                        >
                            Change email
                        </button>
                    </div>

                    <div className="flex justify-center gap-2">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (otpRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                value={digit}
                                onChange={(e) => handleOTPChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 text-center text-xl font-bold bg-zinc-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                                maxLength={6}
                            />
                        ))}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-white text-black hover:bg-white/90 font-semibold h-10"
                        disabled={isLoading || otp.join('').length !== 6}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            'Verify & Continue'
                        )}
                    </Button>

                    <div className="text-center">
                        {countdown > 0 ? (
                            <p className="text-sm text-zinc-500">
                                Resend code in <span className="text-white">{countdown}s</span>
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={isLoading}
                                className="text-sm text-white hover:underline disabled:opacity-50"
                            >
                                Resend Code
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}
