import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { api } from '../../lib/api';

export function PhoneAuthForm({ mode = 'login', onSuccess }) {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [step, setStep] = useState('phone'); // 'phone' or 'otp'
    const [isLoading, setIsLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();
    const otpRefs = useRef([]);
    const recaptchaRef = useRef(null);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const setupRecaptcha = () => {
        if (!recaptchaRef.current) {
            recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => { },
            });
        }
        return recaptchaRef.current;
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();

        if (!phone || phone.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }

        setIsLoading(true);
        try {
            const appVerifier = setupRecaptcha();
            const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);
            setStep('otp');
            setCountdown(60);
            toast.success('OTP sent successfully!');
        } catch (error) {
            console.error('Send OTP error:', error);
            if (error.code === 'auth/invalid-phone-number') {
                toast.error('Invalid phone number format');
            } else if (error.code === 'auth/too-many-requests') {
                toast.error('Too many requests. Please try again later.');
            } else {
                toast.error(error.message || 'Failed to send OTP');
            }
            // Reset recaptcha on error
            if (recaptchaRef.current) {
                recaptchaRef.current.clear();
                recaptchaRef.current = null;
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOTPChange = (index, value) => {
        if (value.length > 1) {
            // Handle paste
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
            toast.error('Please enter the complete OTP');
            return;
        }

        setIsLoading(true);
        try {
            const result = await confirmationResult.confirm(otpCode);
            const user = result.user;

            // Check if user exists in our database
            try {
                await api.get('/api/v1/users/me');
                toast.success('Welcome back!');
            } catch (err) {
                // New user - register them
                await api.post('/api/v1/users/register', {
                    email: `${user.phoneNumber?.replace(/\D/g, '')}@phone.user`,
                    fullName: 'Phone User',
                    role: 'contributor',
                });
                toast.success('Account created successfully!');
            }

            onSuccess?.();
            navigate('/dashboard');
        } catch (error) {
            console.error('Verify OTP error:', error);
            if (error.code === 'auth/invalid-verification-code') {
                toast.error('Invalid OTP. Please try again.');
            } else if (error.code === 'auth/code-expired') {
                toast.error('OTP expired. Please request a new one.');
            } else {
                toast.error(error.message || 'Failed to verify OTP');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = () => {
        setStep('phone');
        setOtp(['', '', '', '', '', '']);
        if (recaptchaRef.current) {
            recaptchaRef.current.clear();
            recaptchaRef.current = null;
        }
    };

    return (
        <div className="space-y-6">
            <div id="recaptcha-container"></div>

            {step === 'phone' ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">
                            Phone Number
                        </label>
                        <div className="relative flex">
                            <div className="flex items-center px-3 bg-zinc-900 border border-r-0 border-white/10 rounded-l-md text-zinc-400 text-sm">
                                +91
                            </div>
                            <div className="relative flex-1">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="9876543210"
                                    className="flex h-10 w-full rounded-r-md border border-white/10 bg-black pl-10 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20"
                                    maxLength={10}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 ml-1">
                            We'll send you a one-time verification code
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-white text-black hover:bg-white/90 font-semibold h-10"
                        disabled={isLoading || phone.length < 10}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                Send OTP <ArrowRight className="w-4 h-4 ml-2" />
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
                        <p className="text-white font-medium">+91 {phone}</p>
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
                                Resend OTP in <span className="text-white">{countdown}s</span>
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                className="text-sm text-white hover:underline"
                            >
                                Resend OTP
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}
