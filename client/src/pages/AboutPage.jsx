import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const STATS = [
    { value: '10K+', label: 'Contributors' },
    { value: '2.5K+', label: 'Missions' },
    { value: '$5M+', label: 'Paid Out' },
    { value: '95%', label: 'Success Rate' },
];

const VALUES = [
    { title: 'Mission-Driven', desc: 'Every project starts with a clear problem.' },
    { title: 'Trust First', desc: 'Reputation is earned, not given.' },
    { title: 'Global', desc: 'Talent exists everywhere.' },
    { title: 'Builder-Centric', desc: 'We optimize for creators.' },
];

const TEAM = [
    { name: 'Alex Chen', role: 'CEO', initials: 'AC' },
    { name: 'Sarah Kim', role: 'CTO', initials: 'SK' },
    { name: 'Marcus Johnson', role: 'Product', initials: 'MJ' },
    { name: 'Emily Zhang', role: 'Design', initials: 'EZ' },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-20">
                    <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-4">About</p>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                        Building the future<br />of work
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-xl mx-auto">
                        PEOPLE connects builders with meaningful problems. No middlemen. No bureaucracy.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
                    {STATS.map((stat) => (
                        <div key={stat.label} className="text-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                            <div className="text-sm text-zinc-500">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Story */}
                <div className="mb-20">
                    <h2 className="text-2xl font-bold mb-6">Our Story</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed">
                        <p>
                            PEOPLE was born from frustration with traditional hiring. Too many talented builders stuck in resume black holes. Too many companies struggling to find the right people.
                        </p>
                        <p>
                            We asked: what if we flipped the model? Instead of hiring for roles, what if we matched builders to missions based on proven skills?
                        </p>
                        <p>
                            That's PEOPLE. Problems meet solutions. Great work happens—regardless of geography or credentials.
                        </p>
                    </div>
                </div>

                {/* Values */}
                <div className="mb-20">
                    <h2 className="text-2xl font-bold mb-6">Values</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {VALUES.map((v) => (
                            <div key={v.title} className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                                <div className="font-semibold text-white mb-1">{v.title}</div>
                                <div className="text-sm text-zinc-500">{v.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team */}
                <div className="mb-20">
                    <h2 className="text-2xl font-bold mb-6">Team</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {TEAM.map((member) => (
                            <div key={member.name} className="text-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                                    {member.initials}
                                </div>
                                <div className="font-medium text-white">{member.name}</div>
                                <div className="text-sm text-zinc-500">{member.role}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center py-16 border border-zinc-800 rounded-2xl">
                    <h2 className="text-3xl font-bold mb-4">Join us</h2>
                    <p className="text-zinc-400 mb-8">Build or hire. PEOPLE is where work happens.</p>
                    <div className="flex justify-center gap-4">
                        <Link to="/signup">
                            <Button className="bg-white text-black hover:bg-zinc-200 h-12 px-8">
                                Get Started
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                        <Link to="/careers">
                            <Button variant="outline" className="h-12 px-8 border-zinc-700 hover:bg-zinc-900">
                                We're Hiring
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
