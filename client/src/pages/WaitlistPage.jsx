import { useState } from 'react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { Button } from '../components/ui/Button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WaitlistPage() {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('contributor');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoading(false);
        setSubmitted(true);
        toast.success('You\'re on the list!');
    };

    if (submitted) {
        return (
            <PublicLayout>
                <div className="py-16 px-6 max-w-xl mx-auto text-center">
                    <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-4">You're in</h1>
                    <p className="text-zinc-400 mb-2">We'll email you when your spot opens.</p>
                    <p className="text-sm text-zinc-600 font-mono">Position #4,892</p>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <div className="py-16 px-6 max-w-xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-4">Early Access</p>
                    <h1 className="text-5xl font-bold tracking-tight mb-6">
                        Join the waitlist
                    </h1>
                    <p className="text-lg text-zinc-400">
                        Be first in line when we launch.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-12">
                    <div className="text-center p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                        <div className="text-2xl font-bold text-white">5K+</div>
                        <div className="text-xs text-zinc-500">Waitlist</div>
                    </div>
                    <div className="text-center p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                        <div className="text-2xl font-bold text-white">500+</div>
                        <div className="text-xs text-zinc-500">Missions</div>
                    </div>
                    <div className="text-center p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                        <div className="text-2xl font-bold text-white">$2M+</div>
                        <div className="text-xs text-zinc-500">Paid</div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full h-12 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">I want to</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole('contributor')}
                                className={`p-4 rounded-xl border text-left transition-all ${role === 'contributor'
                                    ? 'bg-white text-black border-white'
                                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                                    }`}
                            >
                                <div className="font-medium">Contribute</div>
                                <div className={`text-xs ${role === 'contributor' ? 'text-zinc-600' : 'text-zinc-500'}`}>Find work</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('initiator')}
                                className={`p-4 rounded-xl border text-left transition-all ${role === 'initiator'
                                    ? 'bg-white text-black border-white'
                                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                                    }`}
                            >
                                <div className="font-medium">Initiate</div>
                                <div className={`text-xs ${role === 'initiator' ? 'text-zinc-600' : 'text-zinc-500'}`}>Post missions</div>
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-medium"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Waitlist'}
                    </Button>
                </form>
            </div>
        </PublicLayout>
    );
}
