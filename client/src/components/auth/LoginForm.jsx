import { useState } from 'react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // TODO: Implement actual login logic
        setTimeout(() => {
            setIsLoading(false);
            // Mock login
            const userData = { email: 'user@example.com', role: 'initiator', name: 'Test User' };
            login(userData);
            navigate('/dashboard/initiator');
            console.log("Logged in");
        }, 1000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input required type="email" className="flex h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Password</label>
                    <a href="#" className="text-xs text-muted-foreground hover:text-white">Forgot password?</a>
                </div>
                <input required type="password" className="flex h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50" />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
                Log In
            </Button>
        </form>
    );
}
