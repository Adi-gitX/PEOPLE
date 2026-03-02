import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';
import { auth } from '../../lib/firebase';
import { multiFactor, TotpMultiFactorGenerator } from 'firebase/auth';
import { ArrowLeft, ShieldCheck, ShieldAlert, RefreshCcw, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const toLocaleDateTime = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString();
};

const buildQrRenderUrl = (otpAuthUrl) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpAuthUrl)}`;
};

export default function AdminSecurityPage() {
    const [security, setSecurity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [secret, setSecret] = useState(null);
    const [qrAuthUrl, setQrAuthUrl] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const { refreshAdminAccess } = useAuthStore();

    const fetchSecurity = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/v1/admin/me/security');
            setSecurity(response.data || null);
        } catch (error) {
            toast.error(error?.message || 'Failed to load admin security settings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSecurity();
    }, [fetchSecurity]);

    const canEnroll = useMemo(() => {
        return !security?.mfaEnrolled;
    }, [security]);

    const startEnrollment = async () => {
        const user = auth.currentUser;
        if (!user) {
            toast.error('You must be logged in to enroll MFA');
            return;
        }

        setProcessing(true);
        try {
            if (!TotpMultiFactorGenerator?.generateSecret) {
                throw new Error('TOTP enrollment is not available in this browser environment');
            }

            const session = await multiFactor(user).getSession();
            const generatedSecret = await TotpMultiFactorGenerator.generateSecret(session);
            const otpAuthUrl = generatedSecret.generateQrCodeUrl(user.email || 'admin@people.local', 'PEOPLE Admin');

            setSecret(generatedSecret);
            setQrAuthUrl(otpAuthUrl);
            toast.success('Scan the QR code with your authenticator app and verify below');
        } catch (error) {
            toast.error(error?.message || 'Failed to initialize TOTP enrollment');
        } finally {
            setProcessing(false);
        }
    };

    const completeEnrollment = async () => {
        const user = auth.currentUser;
        if (!user || !secret) {
            toast.error('TOTP setup is not initialized');
            return;
        }
        if (!verificationCode.trim()) {
            toast.error('Enter the 6-digit code from your authenticator app');
            return;
        }

        setProcessing(true);
        try {
            const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, verificationCode.trim());
            await multiFactor(user).enroll(assertion, 'PEOPLE Admin TOTP');
            await user.getIdToken(true);
            await refreshAdminAccess();
            await fetchSecurity();
            setSecret(null);
            setQrAuthUrl('');
            setVerificationCode('');
            toast.success('Admin TOTP enrolled successfully');
        } catch (error) {
            toast.error(error?.message || 'Failed to verify TOTP code');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter text-white">Admin Security</h1>
                        <p className="text-neutral-400 mt-1">Manage MFA and security posture for your admin account</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchSecurity}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-sm text-neutral-300 hover:bg-white/5"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="text-neutral-400 text-sm">Loading security settings...</div>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="border border-white/10 rounded-xl bg-[#0A0A0A] p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-white">Current Status</h2>
                            <div className="space-y-2 text-sm">
                                <p className="text-neutral-400">
                                    Enforcement mode: <span className="text-white">{security?.mfaEnforcementMode || 'warn'}</span>
                                </p>
                                <p className="text-neutral-400">
                                    MFA required: <span className="text-white">{security?.mfaRequired ? 'Yes' : 'No'}</span>
                                </p>
                                <p className="text-neutral-400">
                                    MFA enrolled: <span className="text-white">{security?.mfaEnrolled ? 'Yes' : 'No'}</span>
                                </p>
                                <p className="text-neutral-400">
                                    MFA satisfied this session: <span className="text-white">{security?.mfaSatisfied ? 'Yes' : 'No'}</span>
                                </p>
                                <p className="text-neutral-500">Enrolled at: {toLocaleDateTime(security?.mfaEnrolledAt)}</p>
                                <p className="text-neutral-500">Last reset: {toLocaleDateTime(security?.lastMfaResetAt)}</p>
                            </div>

                            <div className={`rounded-lg border px-4 py-3 text-sm ${
                                security?.mfaRequired && !security?.mfaSatisfied && security?.mfaEnforcementMode === 'enforce'
                                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                    : 'border-green-500/30 bg-green-500/10 text-green-300'
                            }`}>
                                {security?.mfaRequired && !security?.mfaSatisfied && security?.mfaEnforcementMode === 'enforce'
                                    ? (
                                        <span className="inline-flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4" />
                                            MFA is enforced. Complete enrollment/challenge to access full admin APIs.
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4" />
                                            Admin MFA policy is currently satisfied.
                                        </span>
                                    )}
                            </div>
                        </div>

                        <div className="border border-white/10 rounded-xl bg-[#0A0A0A] p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-white">Authenticator App (TOTP)</h2>
                            {!qrAuthUrl ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-neutral-400">
                                        Enroll your authenticator app (Google Authenticator, 1Password, Authy, etc.) for admin MFA.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={startEnrollment}
                                        disabled={processing || !canEnroll}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold disabled:opacity-60"
                                    >
                                        <KeyRound className="w-4 h-4" />
                                        {security?.mfaEnrolled ? 'Already Enrolled' : 'Start TOTP Enrollment'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-neutral-400">
                                        Scan this QR code with your authenticator app, then enter the generated 6-digit code.
                                    </p>
                                    <img
                                        src={buildQrRenderUrl(qrAuthUrl)}
                                        alt="TOTP enrollment QR code"
                                        className="w-56 h-56 rounded-lg border border-white/10 bg-white p-2"
                                    />
                                    <p className="text-[11px] text-neutral-500 break-all">{qrAuthUrl}</p>
                                    <input
                                        value={verificationCode}
                                        onChange={(event) => setVerificationCode(event.target.value)}
                                        placeholder="Enter 6-digit code"
                                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={completeEnrollment}
                                            disabled={processing}
                                            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold disabled:opacity-60"
                                        >
                                            Verify and Enable MFA
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSecret(null);
                                                setQrAuthUrl('');
                                                setVerificationCode('');
                                            }}
                                            disabled={processing}
                                            className="px-4 py-2 rounded-lg border border-white/10 text-sm text-neutral-300 hover:bg-white/5 disabled:opacity-60"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
