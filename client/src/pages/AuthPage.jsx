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
                <div className="w-full max-w-md space-y-10">
                    <div className="text-center space-y-2">
                        <h2 className="text-4xl font-bold tracking-tight">
                            {mode === 'login' ? 'Welcome back' : 'Create Account'}
                        </h2>
                        <p className="text-muted-foreground">
                            {mode === 'login' ? 'Enter your credentials to access your account' : 'Start automating your workflows today'}
                        </p>
                    </div>

                    <div className="">
                        {mode === 'login' ? <LoginForm /> : <SignupForm />}

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
