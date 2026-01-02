import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Briefcase } from 'lucide-react';

const PERKS = [
    { title: 'Remote-First', desc: 'Work from anywhere' },
    { title: 'Equity', desc: 'Own a piece' },
    { title: 'Flexible', desc: 'Async culture' },
    { title: 'Impact', desc: 'Shape the future' },
];

const JOBS = [
    {
        title: 'Senior Frontend Engineer',
        dept: 'Engineering',
        location: 'Remote',
        type: 'Full-time',
    },
    {
        title: 'Backend Engineer',
        dept: 'Engineering',
        location: 'Remote',
        type: 'Full-time',
    },
    {
        title: 'Product Designer',
        dept: 'Design',
        location: 'Remote',
        type: 'Full-time',
    },
    {
        title: 'Growth Marketing',
        dept: 'Marketing',
        location: 'Remote',
        type: 'Full-time',
    },
];

export default function CareersPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-4">Careers</p>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                        Build with us
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-md mx-auto">
                        Join a team transforming how the world works together.
                    </p>
                </div>

                {/* Perks */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                    {PERKS.map((perk) => (
                        <div key={perk.title} className="text-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <div className="font-semibold text-white mb-1">{perk.title}</div>
                            <div className="text-sm text-zinc-500">{perk.desc}</div>
                        </div>
                    ))}
                </div>

                {/* Jobs */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
                    <div className="space-y-3">
                        {JOBS.map((job) => (
                            <div
                                key={job.title}
                                className="flex items-center justify-between p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors cursor-pointer"
                            >
                                <div>
                                    <div className="font-semibold text-white mb-1">{job.title}</div>
                                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <Briefcase className="w-3 h-3" />
                                            {job.dept}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {job.location}
                                        </span>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-zinc-500" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center py-12 border border-zinc-800 rounded-2xl">
                    <h2 className="text-2xl font-bold mb-3">Don't see a fit?</h2>
                    <p className="text-zinc-400 mb-6">We're always looking for exceptional people.</p>
                    <Link to="/contact">
                        <Button variant="outline" className="h-12 px-8 border-zinc-700 hover:bg-zinc-900">
                            Get in Touch
                        </Button>
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    );
}
