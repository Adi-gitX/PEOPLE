import { useParams } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Clock, Globe, Shield, Users } from 'lucide-react';

export default function MissionDetailsPage() {
    // Mock ID usage
    const { id } = useParams();

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                {/* Hero */}
                <div className="border-b border-white/10 pb-12 mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs font-mono">Accepting Applications</span>
                                <span className="text-muted-foreground text-sm">Posted 2 days ago</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">AI Meeting Intelligence</h1>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>TechFlow Corp</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    <span>Remote / Global</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    <span>Escrow Secured</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white/5 border border-white/10 rounded-xl min-w-[280px]">
                            <div className="text-sm text-muted-foreground mb-1">Total Bounty</div>
                            <div className="text-3xl font-bold text-green-400 mb-4">$2,500</div>
                            <Button className="w-full h-10 bg-white text-black hover:bg-white/90">Apply for Role</Button>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Left: Content */}
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold mb-6">Problem Statement</h2>
                            <div className="prose prose-invert max-w-none text-gray-400 leading-relaxed">
                                <p>
                                    Our current meeting workflow is fragmented combined with manual note-taking. We need a system that can ingest Zoom audio recordings, process them using OpenAI's Whisper and GPT-4, and output structured JSON summaries directly into our Notion database.
                                </p>
                                <p className="mt-4">
                                    The system must handle:
                                    <br />- Speaker diarization
                                    <br />- Action item extraction with assignees
                                    <br />- Sentiment analysis per topic
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-6">Milestones & Timeline</h2>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="mt-1">
                                        <CheckCircle2 className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Architecture Review</h3>
                                        <p className="text-sm text-muted-foreground">Week 1 • 20% Release ($500)</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1">
                                        <div className="h-5 w-5 rounded-full border border-white/20" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-muted-foreground">MVP Implementation</h3>
                                        <p className="text-sm text-muted-foreground">Week 3 • 40% Release ($1,000)</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1">
                                        <div className="h-5 w-5 rounded-full border border-white/20" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-muted-foreground">Final Polish & Handoff</h3>
                                        <p className="text-sm text-muted-foreground">Week 4 • 40% Release ($1,000)</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right: Team */}
                    <div className="space-y-8">
                        <section className="p-6 rounded-xl border border-white/10 bg-white/5">
                            <h3 className="font-bold mb-6">Team Structure</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="text-xs font-mono text-muted-foreground mb-2">LEAD CONTRIBUTOR</div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                                            JS
                                        </div>
                                        <div>
                                            <div className="font-medium">Sarah Chen</div>
                                            <div className="text-xs text-muted-foreground">Top 1% • Systems</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="opacity-50">
                                    <div className="text-xs font-mono text-muted-foreground mb-2">SHADOW CONTRIBUTOR</div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center text-muted-foreground">
                                            ?
                                        </div>
                                        <div>
                                            <div className="font-medium text-muted-foreground">Pending Match</div>
                                            <div className="text-xs text-muted-foreground">AI / Backend spec</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-mono text-muted-foreground mb-2">Reviewer</div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                                            p
                                        </div>
                                        <div>
                                            <div className="font-medium">people Core</div>
                                            <div className="text-xs text-muted-foreground">Quality Assurance</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
