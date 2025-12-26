import { useState } from 'react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase } from 'lucide-react';

export function SignupForm() {
    const [role, setRole] = useState(null); // 'initiator' | 'contributor'
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!role) return;
        setIsLoading(true);
        // TODO: Implement actual signup logic
        setTimeout(() => {
            setIsLoading(false);
            const userData = { email: 'user@example.com', role: role, name: 'Test User' };
            login(userData);
            if (role === 'initiator') {
                navigate('/dashboard/initiator');
            } else {
                navigate('/dashboard/contributor');
            }
        }, 1000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {!role ? (
                <div className="space-y-4">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        I want to...
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setRole('initiator')}
                            className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-center space-y-2 h-32"
                        >
                            <Briefcase className="w-6 h-6 mb-1" />
                            <span className="font-bold">Start a Mission</span>
                            <span className="text-xs text-muted-foreground">Hire a team to solve a problem</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setRole('contributor')}
                            className="flex flex-col items-center justify-center p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-center space-y-2 h-32"
                        >
                            <User className="w-6 h-6 mb-1" />
                            <span className="font-bold">Join a Team</span>
                            <span className="text-xs text-muted-foreground">Solve problems & earn trust</span>
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        <button type="button" onClick={() => setRole(null)} className="text-xs text-muted-foreground hover:text-white mb-2">
                            ← Back to role selection
                        </button>
                        <div className="mt-1">
                            <label className="text-sm font-medium">Full Name</label>
                            <input required type="text" className="flex h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <input required type="email" className="flex h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <input required type="password" className="flex h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50" />
                    </div>

                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        {role === 'contributor' ? 'Apply to Join' : 'Create Account'}
                    </Button>
                </>
            )}

        </form>
    );
}
