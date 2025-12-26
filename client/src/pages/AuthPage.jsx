import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { Navbar } from '../components/layout/Navbar';

export default function AuthPage() {
    const [searchParams] = useSearchParams();
    const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
    const [mode, setMode] = useState(initialMode);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-6 py-20">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tighter">
                            {mode === 'login' ? 'Welcome back' : 'Join the network'}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {mode === 'login' ? 'Enter your credentials to access your account' : 'Select your role and start your journey'}
                        </p>
                    </div>

                    <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
                        {mode === 'login' ? <LoginForm /> : <SignupForm />}

                        <div className="mt-6 text-center text-sm">
                            <span className="text-muted-foreground">
                                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            </span>
                            <button
                                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                className="font-medium text-white hover:underline underline-offset-4"
                            >
                                {mode === 'login' ? 'Sign up' : 'Log in'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
