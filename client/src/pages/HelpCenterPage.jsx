import { useState } from 'react';
import { PublicLayout } from '../components/layout/PublicLayout';
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
    const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim();
    const articleNotice = 'Knowledge-base article pages are being published. Use Contact Form for immediate support.';

    return (
        <PublicLayout>
            <div className="py-16 px-6 max-w-5xl mx-auto">
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
                                        <button
                                            type="button"
                                            disabled
                                            title={articleNotice}
                                            className="w-full flex items-center justify-between p-4 text-sm text-zinc-500 cursor-not-allowed text-left"
                                        >
                                            {article}
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-zinc-500 mb-12 text-center">
                    Knowledge-base articles are being rolled out. Use the contact form for active support.
                </p>

                {/* Contact */}
                <div className="grid md:grid-cols-3 gap-4">
                    <Link to="/contact" className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors text-center">
                        <MessageCircle className="w-6 h-6 text-white mx-auto mb-3" />
                        <div className="font-medium mb-1">Contact Form</div>
                        <div className="text-sm text-zinc-500">Create a support ticket</div>
                    </Link>
                    {supportEmail ? (
                        <a href={`mailto:${supportEmail}`} className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors text-center">
                            <Mail className="w-6 h-6 text-white mx-auto mb-3" />
                            <div className="font-medium mb-1">Email</div>
                            <div className="text-sm text-zinc-500">{supportEmail}</div>
                        </a>
                    ) : (
                        <Link to="/contact" className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors text-center">
                            <Mail className="w-6 h-6 text-white mx-auto mb-3" />
                            <div className="font-medium mb-1">Email</div>
                            <div className="text-sm text-zinc-500">Use contact form</div>
                        </Link>
                    )}
                    <Link to="/faq" className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors text-center">
                        <Book className="w-6 h-6 text-white mx-auto mb-3" />
                        <div className="font-medium mb-1">FAQ</div>
                        <div className="text-sm text-zinc-500">Common questions</div>
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
}
