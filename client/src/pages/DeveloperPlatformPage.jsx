import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Copy, Check, ArrowRight, Terminal, Code, Webhook, Key } from 'lucide-react';

const CODE_EXAMPLE = `const response = await fetch('https://api.people.dev/v1/missions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Build React Dashboard',
    budgetMax: 2500,
    skills: ['React', 'TypeScript']
  })
});`;

const FEATURES = [
    { icon: Code, title: 'REST API', desc: 'Full API access' },
    { icon: Webhook, title: 'Webhooks', desc: 'Real-time events' },
    { icon: Key, title: 'OAuth2', desc: 'Secure auth' },
    { icon: Terminal, title: 'SDKs', desc: 'JS, Python, Go' },
];

export default function DeveloperPlatformPage() {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(CODE_EXAMPLE);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-20">
                    <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-4">For Developers</p>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                        Build on PEOPLE
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-md mx-auto">
                        APIs and SDKs to integrate mission-based work into your products.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                    {FEATURES.map((f) => (
                        <div key={f.title} className="p-6 bg-zinc-900 rounded-xl border border-zinc-800">
                            <f.icon className="w-6 h-6 text-white mb-4" />
                            <div className="font-semibold text-white mb-1">{f.title}</div>
                            <div className="text-sm text-zinc-500">{f.desc}</div>
                        </div>
                    ))}
                </div>

                {/* Code Block */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-mono text-zinc-500">Quick example</p>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                        <pre className="p-6 overflow-x-auto text-sm">
                            <code className="text-zinc-300">{CODE_EXAMPLE}</code>
                        </pre>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center py-16 border border-zinc-800 rounded-2xl">
                    <h2 className="text-3xl font-bold mb-4">Get API access</h2>
                    <p className="text-zinc-400 mb-8">Join our developer beta and start building.</p>
                    <div className="flex justify-center gap-4">
                        <Link to="/waitlist">
                            <Button className="bg-white text-black hover:bg-zinc-200 h-12 px-8">
                                Join Beta
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
