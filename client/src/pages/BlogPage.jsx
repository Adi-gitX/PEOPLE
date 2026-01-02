import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Clock, ArrowRight } from 'lucide-react';

const POSTS = [
    {
        id: 1,
        title: 'The Future of Freelancing',
        excerpt: 'How mission-based matching is changing how we work.',
        author: 'Alex Chen',
        date: 'Dec 28, 2025',
        readTime: '5 min',
        category: 'Industry',
        featured: true,
    },
    {
        id: 2,
        title: 'Building Trust in Remote Teams',
        excerpt: 'Our approach to trust scores and better outcomes.',
        author: 'Sarah Kim',
        date: 'Dec 20, 2025',
        readTime: '4 min',
        category: 'Product',
    },
    {
        id: 3,
        title: 'Writing the Perfect Mission Brief',
        excerpt: 'Tips from top initiators on attracting talent.',
        author: 'Marcus Johnson',
        date: 'Dec 15, 2025',
        readTime: '6 min',
        category: 'Tips',
    },
    {
        id: 4,
        title: 'Introducing Milestones',
        excerpt: 'Better project management for everyone.',
        author: 'Emily Zhang',
        date: 'Dec 10, 2025',
        readTime: '3 min',
        category: 'Product',
    },
    {
        id: 5,
        title: 'Contributor Spotlight: Maria Santos',
        excerpt: 'From self-taught to thriving on PEOPLE.',
        author: 'Alex Chen',
        date: 'Dec 5, 2025',
        readTime: '7 min',
        category: 'Community',
    },
    {
        id: 6,
        title: 'Security Update: 2FA',
        excerpt: 'Two-factor authentication is now available.',
        author: 'Security Team',
        date: 'Dec 1, 2025',
        readTime: '2 min',
        category: 'Security',
    },
];

export default function BlogPage() {
    const featured = POSTS.find(p => p.featured);
    const rest = POSTS.filter(p => !p.featured);

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-4">Blog</p>
                    <h1 className="text-5xl font-bold tracking-tight mb-6">
                        Insights & Updates
                    </h1>
                    <p className="text-lg text-zinc-400">
                        Stories from the PEOPLE team.
                    </p>
                </div>

                {/* Featured */}
                {featured && (
                    <div className="mb-12 p-8 bg-zinc-900 border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-2 py-1 bg-white text-black text-xs font-medium rounded">Featured</span>
                            <span className="text-xs text-zinc-500">{featured.category}</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-3">{featured.title}</h2>
                        <p className="text-zinc-400 mb-4">{featured.excerpt}</p>
                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                            <span>{featured.author}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {featured.readTime}
                            </span>
                        </div>
                    </div>
                )}

                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
                    {rest.map((post) => (
                        <article
                            key={post.id}
                            className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors cursor-pointer"
                        >
                            <span className="text-xs text-zinc-500">{post.category}</span>
                            <h3 className="text-lg font-semibold mt-2 mb-2">{post.title}</h3>
                            <p className="text-sm text-zinc-500 mb-4">{post.excerpt}</p>
                            <div className="flex items-center justify-between text-xs text-zinc-600">
                                <span>{post.author}</span>
                                <span>{post.readTime}</span>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Newsletter */}
                <div className="text-center py-12 border border-zinc-800 rounded-2xl">
                    <h2 className="text-2xl font-bold mb-3">Stay updated</h2>
                    <p className="text-zinc-400 mb-6">Get articles delivered to your inbox.</p>
                    <form className="flex gap-3 max-w-sm mx-auto">
                        <input
                            type="email"
                            placeholder="you@example.com"
                            className="flex-1 h-12 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                        />
                        <button className="h-12 px-6 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 transition-colors">
                            Subscribe
                        </button>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
}
