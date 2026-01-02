import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

const PLANS = [
    {
        name: 'Starter',
        description: 'For individuals getting started',
        price: 'Free',
        period: '',
        features: [
            'Access to mission marketplace',
            'Basic profile & portfolio',
            'Up to 3 active applications',
            'Community support',
            'Standard matching',
        ],
        cta: 'Get Started',
        href: '/signup',
        highlighted: false,
    },
    {
        name: 'Pro',
        description: 'For serious freelancers',
        price: '$29',
        period: '/mo',
        features: [
            'Everything in Starter',
            'Unlimited applications',
            'Priority matching',
            'Advanced analytics',
            'Direct messaging',
            'Featured badge',
            'Priority support',
        ],
        cta: 'Start Free Trial',
        href: '/signup?plan=pro',
        highlighted: true,
    },
    {
        name: 'Enterprise',
        description: 'For teams & agencies',
        price: 'Custom',
        period: '',
        features: [
            'Everything in Pro',
            'Team workspace',
            'API access',
            'Dedicated manager',
            'Custom integrations',
            'SLA guarantee',
        ],
        cta: 'Contact Sales',
        href: '/contact',
        highlighted: false,
    },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-20">
                    <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-4">Pricing</p>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                        Simple pricing
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-md mx-auto">
                        Start free. Upgrade when you need more.
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

            <Footer />
        </div>
    );
}
