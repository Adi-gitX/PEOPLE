import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ChevronDown, Search } from 'lucide-react';

const FAQ_DATA = [
    {
        category: 'Getting Started',
        questions: [
            {
                q: 'How do I create an account?',
                a: 'Click "Get Started" on our homepage and choose whether you want to join as a Contributor (find work) or Initiator (post missions). Complete the signup form with your email and password.',
            },
            {
                q: 'What is the difference between a Contributor and an Initiator?',
                a: 'Contributors are freelancers/builders who complete missions. Initiators are clients who post missions and hire Contributors to complete them.',
            },
            {
                q: 'How does the matching algorithm work?',
                a: 'Our algorithm analyzes your skills, experience, availability, and past performance to match you with the most relevant missions. The more complete your profile, the better your matches.',
            },
        ],
    },
    {
        category: 'Missions',
        questions: [
            {
                q: 'How do I apply for a mission?',
                a: 'Browse available missions on the Explore page, click on one that interests you, and submit an application with your cover letter and proposed approach.',
            },
            {
                q: 'What happens after I apply?',
                a: 'The Initiator will review your application. You will receive a notification when your application is accepted, rejected, or if you are shortlisted.',
            },
            {
                q: 'Can I withdraw my application?',
                a: 'Yes, you can withdraw pending applications from your Applications page at any time before they are accepted.',
            },
        ],
    },
    {
        category: 'Payments',
        questions: [
            {
                q: 'How does payment work?',
                a: 'Initiators deposit funds into escrow before the mission starts. Once the mission is completed and approved, funds are released to the Contributor.',
            },
            {
                q: 'When do I get paid?',
                a: 'Payment is released when the Initiator marks the mission as complete. Funds become available in your wallet immediately.',
            },
            {
                q: 'What are the platform fees?',
                a: 'PEOPLE charges a 10% platform fee on completed missions. This is deducted from the total mission value before payment to the Contributor.',
            },
            {
                q: 'How do I withdraw my earnings?',
                a: 'Go to your Wallet page and click "Withdraw". You can withdraw to a linked bank account (Stripe Connect integration coming soon).',
            },
        ],
    },
    {
        category: 'Trust & Safety',
        questions: [
            {
                q: 'What is the Trust Score?',
                a: 'Your Trust Score reflects your reliability on the platform, calculated from reviews, completion rate, and verification status. Higher scores lead to better matches.',
            },
            {
                q: 'How do disputes work?',
                a: 'If there is a disagreement about mission completion, either party can open a dispute. Our admin team will review the case and make a fair decision.',
            },
            {
                q: 'Is my data secure?',
                a: 'Yes. We use industry-standard encryption, secure authentication through Firebase, and never sell your personal data. See our Privacy Policy for details.',
            },
        ],
    },
];

export default function FAQPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [openItems, setOpenItems] = useState({});

    const toggleItem = (categoryIndex, questionIndex) => {
        const key = `${categoryIndex}-${questionIndex}`;
        setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredData = FAQ_DATA.map(category => ({
        ...category,
        questions: category.questions.filter(
            item =>
                item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    })).filter(category => category.questions.length > 0);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />

            <div className="flex-1 pt-32 pb-20 px-6 max-w-4xl mx-auto w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tighter mb-4">Frequently Asked Questions</h1>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                        Find answers to common questions about the PEOPLE platform.
                    </p>
                </div>

                <div className="relative mb-8">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search FAQs..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                    />
                </div>

                {filteredData.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-zinc-400">No results found for "{searchQuery}"</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {filteredData.map((category, catIndex) => (
                            <div key={catIndex}>
                                <h2 className="text-lg font-semibold text-white mb-4">{category.category}</h2>
                                <div className="space-y-2">
                                    {category.questions.map((item, qIndex) => {
                                        const key = `${catIndex}-${qIndex}`;
                                        const isOpen = openItems[key];

                                        return (
                                            <div
                                                key={qIndex}
                                                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => toggleItem(catIndex, qIndex)}
                                                    className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors"
                                                >
                                                    <span className="font-medium text-white pr-4">{item.q}</span>
                                                    <ChevronDown
                                                        className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''
                                                            }`}
                                                    />
                                                </button>
                                                {isOpen && (
                                                    <div className="px-4 pb-4 text-zinc-400 leading-relaxed border-t border-zinc-800 pt-4">
                                                        {item.a}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                    <h3 className="font-semibold text-white mb-2">Still have questions?</h3>
                    <p className="text-zinc-400 mb-4">Can not find what you are looking for? Get in touch.</p>
                    <a
                        href="/contact"
                        className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                    >
                        Contact Support
                    </a>
                </div>
            </div>

            <Footer />
        </div>
    );
}
