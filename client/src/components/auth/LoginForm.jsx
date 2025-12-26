import { useState } from 'react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock } from 'lucide-react';

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
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground ml-1">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        required
                        type="email"
                        placeholder="name@example.com"
                        className="flex h-10 w-full rounded-md border border-white/10 bg-black pl-10 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all hover:border-white/20"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-medium text-muted-foreground">Password</label>
                    <a href="#" className="text-xs text-muted-foreground hover:text-white transition-colors">Forgot password?</a>
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        required
                        type="password"
                        placeholder="••••••••••••"
                        className="flex h-10 w-full rounded-md border border-white/10 bg-black pl-10 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all hover:border-white/20"
                    />
                </div>
            </div>

            <Button type="submit" className="w-full bg-white text-black hover:bg-white/90 font-semibold h-10 mt-2" isLoading={isLoading}>
                Log In
            </Button>
        </form>
    );
}
