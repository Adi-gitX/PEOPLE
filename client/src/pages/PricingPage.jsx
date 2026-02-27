import { PublicLayout } from '../components/layout/PublicLayout';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

const PLANS = [
    {
        name: 'Core Marketplace',
        description: 'For initiators and contributors',
        price: '$0',
        period: '',
        features: [
            'Access to mission marketplace',
            '0% platform markup on missions',
            'No credit card required at signup',
            'Secure realtime messaging',
            'Escrow-based payments when you hire',
        ],
        cta: 'Try for Free',
        href: '/signup',
        highlighted: true,
    },
    {
        name: 'Escrow Funding',
        description: 'Only when you decide to hire',
        price: 'On Demand',
        period: '',
        features: [
            'Fund mission escrow when ready',
            'Milestone-based release controls',
            'Transparent payout breakdown',
            'Only processor fees may apply',
            'No PEOPLE commission',
        ],
        cta: 'View Wallet',
        href: '/wallet',
        highlighted: false,
    },
    {
        name: 'Custom Support',
        description: 'For high-volume organizations',
        price: 'Contact',
        period: '',
        features: [
            'Custom onboarding',
            'Dedicated support channel',
            'Team process guidance',
            'Optional integration consulting',
        ],
        cta: 'Contact Support',
        href: '/contact',
        highlighted: false,
    },
];

export default function PricingPage() {
    return (
        <PublicLayout>
            <div className="py-16 px-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-20">
                    <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-4">Pricing</p>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                        Simple pricing
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-md mx-auto">
                        0% platform markup. No card at signup.
                    </p>
                </div>

                {/* Plans */}
                <div className="grid md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`rounded-2xl p-8 ${plan.highlighted
                                ? 'bg-white text-black'
                                : 'bg-zinc-900 border border-zinc-800'
                                }`}
                        >
                            <div className="mb-8">
                                <h3 className={`text-lg font-semibold mb-1 ${plan.highlighted ? 'text-black' : 'text-white'}`}>
                                    {plan.name}
                                </h3>
                                <p className={`text-sm ${plan.highlighted ? 'text-zinc-600' : 'text-zinc-500'}`}>
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mb-8">
                                <span className={`text-5xl font-bold tracking-tight ${plan.highlighted ? 'text-black' : 'text-white'}`}>
                                    {plan.price}
                                </span>
                                <span className={plan.highlighted ? 'text-zinc-600' : 'text-zinc-500'}>
                                    {plan.period}
                                </span>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm">
                                        <Check className={`w-4 h-4 mt-0.5 ${plan.highlighted ? 'text-black' : 'text-zinc-400'}`} />
                                        <span className={plan.highlighted ? 'text-zinc-700' : 'text-zinc-400'}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Link to={plan.href} className="block">
                                <Button
                                    className={`w-full h-12 font-medium ${plan.highlighted
                                        ? 'bg-black text-white hover:bg-zinc-800'
                                        : 'bg-white text-black hover:bg-zinc-200'
                                        }`}
                                >
                                    {plan.cta}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* FAQ Link */}
                <div className="text-center mt-16">
                    <p className="text-zinc-500">
                        Have questions?{' '}
                        <Link to="/faq" className="text-white underline underline-offset-4 hover:text-zinc-300">
                            Read our FAQ
                        </Link>
                    </p>
                </div>
            </div>

        </PublicLayout >
    );
}
