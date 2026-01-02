import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, MessageCircle, Mail, Book } from 'lucide-react';

const CATEGORIES = [
    {
        title: 'Getting Started',
        articles: ['Create your first mission', 'Set up your profile', 'Understanding trust scores'],
    },
    {
        title: 'For Contributors',
        articles: ['Apply to missions', 'Optimize match power', 'Get paid'],
    },
    {
        title: 'For Initiators',
        articles: ['Write mission briefs', 'Review applications', 'Manage milestones'],
    },
    {
        title: 'Payments',
        articles: ['How escrow works', 'Release payments', 'Refund policy'],
    },
    {
        title: 'Account',
        articles: ['Update profile', 'Notifications', 'Security settings'],
    },
    {
        title: 'Trust & Safety',
        articles: ['Report issues', 'Dispute resolution', 'Verification'],
    },
];

export default function HelpCenterPage() {
    const [search, setSearch] = useState('');

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-4">Support</p>
                    <h1 className="text-5xl font-bold tracking-tight mb-6">
                        Help Center
                    </h1>
                    <p className="text-lg text-zinc-400 mb-8">
                        Find answers or get in touch.
                    </p>

                    {/* Search */}
                    <div className="max-w-md mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search for help..."
                            className="w-full h-12 pl-12 pr-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
                    {CATEGORIES.map((cat) => (
                        <div key={cat.title} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-zinc-800">
                                <h3 className="font-semibold">{cat.title}</h3>
                            </div>
                            <ul>
                                {cat.articles.map((article, idx) => (
                                    <li key={idx}>
                                        <button className="w-full flex items-center justify-between p-4 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-left">
                                            {article}
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div className="grid md:grid-cols-3 gap-4">
                    <Link to="/contact" className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors text-center">
                        <MessageCircle className="w-6 h-6 text-white mx-auto mb-3" />
                        <div className="font-medium mb-1">Chat</div>
                        <div className="text-sm text-zinc-500">Get instant help</div>
                    </Link>
                    <a href="mailto:support@people.dev" className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors text-center">
                        <Mail className="w-6 h-6 text-white mx-auto mb-3" />
                        <div className="font-medium mb-1">Email</div>
                        <div className="text-sm text-zinc-500">24hr response</div>
                    </a>
                    <Link to="/faq" className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors text-center">
                        <Book className="w-6 h-6 text-white mx-auto mb-3" />
                        <div className="font-medium mb-1">FAQ</div>
                        <div className="text-sm text-zinc-500">Common questions</div>
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    );
}
