import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { ArrowRight, CheckCircle2, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 border-b border-white/5 overflow-hidden">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">

                    {/* Left: Text Content */}
                    <div className="space-y-8">
                        <div className="text-white font-mono text-4xl mb-4 text-white/90 font-display">
                            Missions
                        </div>
                        <h1 className="text-7xl md:text-9xl font-bold tracking-tighter leading-[0.85] text-white">
                            Not Gigs.
                        </h1>
                        <div className="space-y-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                            <p>
                                The collaboration platform where top students solve real problems for ambitious initiators.
                            </p>
                            <p>
                                No bidding. No profiles. Just guaranteed outcomes through curated teams.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link to="/signup?mode=initiator">
                                <Button className="bg-white text-black hover:bg-white/90 h-12 px-8 text-base font-semibold rounded-none">
                                    Start a Mission
                                </Button>
                            </Link>
                            <Link to="/signup?mode=contributor">
                                <Button variant="outline" className="h-12 px-8 text-base font-semibold border-white/20 hover:bg-white/5 rounded-none text-white">
                                    Join the Network
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Right: Terminal Visual */}
                    <div className="relative">
                        <div className="rounded-sm border border-white/10 bg-black w-full max-w-xl ml-auto shadow-2xl shadow-blue-900/10">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                                </div>
                                <div className="ml-4 text-xs font-mono text-muted-foreground">people_OS</div>
                            </div>
                            <div className="p-6 font-mono text-sm leading-relaxed text-[#eee]">
                                <div className="flex gap-2 mb-2">
                                    <span className="text-blue-400">➜</span>
                                    <span>mission init --type=MVP --budget=escrow</span>
                                </div>
                                <div className="text-muted-foreground/60 mb-1">{'>'} Analyzing mission scope...</div>
                                <div className="text-muted-foreground/60 mb-1">{'>'} Matching skills: React, Node.js, Systems Design</div>
                                <div className="text-muted-foreground/60 mb-4">{'>'} Accessing curated network...</div>

                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span>Lead Contributor:</span>
                                        <span className="text-green-400">Assigned [Top 1%]</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Shadow Contributor:</span>
                                        <span className="text-green-400">Assigned</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Core Reviewer:</span>
                                        <span className="text-green-400">Active</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex gap-2">
                                        <span className="text-white">Outcome:</span>
                                        <span className="text-blue-400">Guaranteed</span>
                                    </div>
                                </div>
                                <div className="animate-pulse inline-block w-2 H-4 bg-white/50 mt-1">_</div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Grid Features */}
            <section id="features" className="py-32 px-6 border-b border-white/5 bg-black">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Row 1 */}
                        <div className="p-10 rounded-sm border border-white/10 bg-black hover:border-white/20 transition-colors h-full flex flex-col justify-between group">
                            <div>
                                <div className="text-white font-mono mb-4 text-2xl">01</div>
                                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">Curated Network</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Access the top 1% of student builders. Admission requires passing reasoning-focused proof tasks, not just resume screening.
                                </p>
                            </div>
                        </div>

                        <div className="p-10 rounded-sm border border-white/10 bg-black hover:border-white/20 transition-colors h-full flex flex-col justify-between group">
                            <div>
                                <div className="text-white font-mono mb-4 text-2xl">02</div>
                                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">Mission Model</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Work begins with a problem, not a person. Initiators submit Missions; we assemble the perfect team to execute.
                                </p>
                            </div>
                        </div>

                        <div className="p-10 rounded-sm border border-white/10 bg-black hover:border-white/20 transition-colors h-full flex flex-col justify-between group">
                            <div>
                                <div className="text-white font-mono mb-4 text-2xl">03</div>
                                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">Zero Failure</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Every Mission adds a Shadow Contributor and Core Reviewer to ensure delivery. If a lead fails, the shadow steps in instantly.
                                </p>
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="p-10 rounded-sm border border-white/10 bg-black hover:border-white/20 transition-colors h-full flex flex-col justify-between group">
                            <div>
                                <div className="text-white font-mono mb-4 text-2xl">04</div>
                                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">No Bidding</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Remove price racing. Contributors are matched based on fit, not whoever is cheapest. Focus on quality execution.
                                </p>
                            </div>
                        </div>

                        <div className="p-10 rounded-sm border border-white/10 bg-black hover:border-white/20 transition-colors h-full flex flex-col justify-between group">
                            <div>
                                <div className="text-white font-mono mb-4 text-2xl">05</div>
                                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">Escrow Payments</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Funds are held securely and released on milestone completion. Contributors get paid; Initiators get outcomes.
                                </p>
                            </div>
                        </div>

                        <div className="p-10 rounded-sm border border-white/10 bg-black hover:border-white/20 transition-colors h-full flex flex-col justify-between group">
                            <div>
                                <div className="text-white font-mono mb-4 text-2xl">06</div>
                                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">Meritocracy</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    No public profiles or popularity contests. Reputation is earned through internal work graphs and peer reviews.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 flex justify-center">
                        <Link to="/signup">
                            <Button className="bg-white text-black hover:bg-white/90 h-12 px-8 text-base font-semibold rounded-none">
                                Join the Waitlist
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-2xl mx-auto space-y-8">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">Ready to start?</h2>
                    <p className="text-lg text-muted-foreground">
                        Join the network that prioritizes execution and growth.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/signup">
                            <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
