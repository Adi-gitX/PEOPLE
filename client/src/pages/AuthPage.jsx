import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { EmailOtpForm } from '../components/auth/EmailOtpForm';
import { Navbar } from '../components/layout/Navbar';
import { KeyRound, Sparkles } from 'lucide-react';

export default function AuthPage() {
    const [searchParams] = useSearchParams();
    const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
    const [mode, setMode] = useState(initialMode);
    const [authMethod, setAuthMethod] = useState('magic'); // 'magic' or 'password'

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-6 py-20">
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

                    {/* Auth Method Tabs */}
                    <div className="flex bg-zinc-900 rounded-lg p-1">
                        <button
                            onClick={() => setAuthMethod('magic')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${authMethod === 'magic'
                                ? 'bg-white text-black'
                                : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            Magic Link
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

                    <div>
                        {authMethod === 'magic' ? (
                            <EmailOtpForm mode={mode} />
                        ) : (
                            mode === 'login' ? <LoginForm /> : <SignupForm />
                        )}

                        <div className="mt-8 text-center text-sm">
                            <span className="text-muted-foreground">
                                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            </span>
                            <button
                                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                className="font-medium text-white hover:text-white/80 transition-colors"
                            >
                                {mode === 'login' ? 'Sign up' : 'Sign in'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
