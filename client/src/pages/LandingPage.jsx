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
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Accepting Applications for Next Batch
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-[0.9] text-white animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        Work begins <br />
                        with a <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">problem.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Not a freelancer marketplace. A mission-based platform connecting early-career builders with real problems given by ambitious initiators.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <Link to="/signup">
                            <Button size="lg" className="h-12 px-8 text-base">
                                Start a Mission
                            </Button>
                        </Link>
                        <Link to="/apply">
                            <Button variant="outline" size="lg" className="h-12 px-8 text-base group">
                                Apply as Contributor <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Philosophy / Value Prop */}
            <section id="philosophy" className="py-24 px-6 border-b border-white/5 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">
                                No bidding. <br />
                                No price wars. <br />
                                Just <span className="text-white">outcomes.</span>
                            </h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                Traditional marketplaces focus on selling individual labor. people focuses on assembling teams to solve problems. We remove the noise of self-promotion and replace it with structure, accountability, and reliability.
                            </p>

                            <div className="space-y-4 pt-4">
                                {[
                                    "Curated teams, not random freelancers.",
                                    "Outcomes guaranteed by the platform.",
                                    "Escrow-backed milestone payments.",
                                    "Zero bidding or cover letters."
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-medium">
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-white">
                                            <CheckCircle2 className="w-3 h-3" />
                                        </div>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            {/* Abstract "Terminal" visual */}
                            <div className="rounded-lg border border-white/10 bg-black overflow-hidden shadow-2xl">
                                <div className="flex items-center px-4 py-2 border-b border-white/10 bg-white/5">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                                    </div>
                                    <div className="ml-4 text-xs text-muted-foreground font-mono">mission_control.sh</div>
                                </div>
                                <div className="p-6 font-mono text-xs md:text-sm text-muted-foreground space-y-2">
                                    <div className="flex gap-2">
                                        <span className="text-green-500">➜</span>
                                        <span className="text-white">init_mission</span>
                                        <span className="text-yellow-500">--type=web_app</span>
                                    </div>
                                    <div className="pl-4 border-l border-white/10 ml-1.5 space-y-1">
                                        <div>Analyzing requirements... <span className="text-green-500">Done</span></div>
                                        <div>Matching lead contributor... <span className="text-green-500">Matched (@alex_dev)</span></div>
                                        <div>Assigning shadow support... <span className="text-green-500">Assigned (@sarah_ui)</span></div>
                                        <div>Allocating core reviewer... <span className="text-green-500">Ready</span></div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <span className="text-green-500">➜</span>
                                        <span className="text-white">status</span>
                                    </div>
                                    <div>Mission Active: <span className="text-white">Building MVP Core</span></div>
                                    <div className="h-4 w-2 bg-white/50 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid Features */}
            <section id="how-it-works" className="py-24 px-6 border-b border-white/5 bg-neutral-950/30">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16 md:text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6">Designed for Reliability</h2>
                        <p className="text-muted-foreground text-lg">
                            We've rethought how work gets done. By introducing platform-level responsibility, we ensure that every mission crosses the finish line.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Terminal className="w-6 h-6 text-white" />,
                                title: "Proof, Not Promises",
                                desc: "Contributors are selected based on reasoning-focused proof tasks, not just resumes or claims."
                            },
                            {
                                icon: <div className="w-6 h-6 rounded border border-white/20 flex items-center justify-center font-bold text-xs">3</div>,
                                title: "Triple-Layer Safety",
                                desc: "Every mission has a Lead, a Shadow, and a Core Reviewer. No single point of failure."
                            },
                            {
                                icon: <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-xs">$$</div>,
                                title: "Escrow Secured",
                                desc: "Funds are held safely by the platform and released only when milestones are verified."
                            }
                        ].map((card, i) => (
                            <div key={i} className="p-8 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                                <div className="mb-6 w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                    {card.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {card.desc}
                                </p>
                            </div>
                        ))}
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
