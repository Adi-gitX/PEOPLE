import { PublicLayout } from '../components/layout/PublicLayout';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const STEPS = [
    {
        number: '01',
        title: 'Post your mission',
        description: 'Describe the problem. Set budget, timeline, and required skills.',
    },
    {
        number: '02',
        title: 'Get matched',
        description: 'Our algorithm finds the best contributors for your needs.',
    },
    {
        number: '03',
        title: 'Review & select',
        description: 'Browse profiles, portfolios, and trust scores.',
    },
    {
        number: '04',
        title: 'Build together',
        description: 'Collaborate with built-in tools and milestone tracking.',
    },
    {
        number: '05',
        title: 'Pay securely',
        description: 'Escrow protects both parties. Release on completion.',
    },
];

export default function WorkflowsPage() {
    return (
        <PublicLayout>
            <div className="py-16 px-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-20">
                    <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-4">How it works</p>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                        Five simple steps
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-md mx-auto">
                        From problem to solution. No complexity.
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-0 mb-20 bg-zinc-900/20 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
                    {STEPS.map((step, idx) => (
                        <div
                            key={step.number}
                            className="flex flex-col md:flex-row gap-8 p-10 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="text-5xl font-bold text-zinc-700 font-mono w-20 shrink-0">
                                {step.number}
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold text-white mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-zinc-400">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center py-16 border border-zinc-800 rounded-2xl bg-zinc-900/20 backdrop-blur-sm">
                    <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
                    <p className="text-zinc-400 mb-8">Join thousands shipping faster with PEOPLE.</p>
                    <div className="flex justify-center gap-4">
                        <Link to="/signup">
                            <Button className="bg-white text-black hover:bg-zinc-200 h-12 px-8">
                                Get Started
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                        <Link to="/explore">
                            <Button variant="outline" className="h-12 px-8 border-zinc-700 hover:bg-zinc-900">
                                Explore Missions
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
