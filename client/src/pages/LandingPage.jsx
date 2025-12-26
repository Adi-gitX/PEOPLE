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
                        <div className="text-white font-mono text-4xl mb-4 text-white/90">
                            {'>_'}
                        </div>
                        <h1 className="text-7xl md:text-9xl font-bold tracking-tighter leading-[0.85] text-white">
                            Build & Earn
                        </h1>
                        <div className="space-y-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                            <p>
                                Publish workflow automations to our marketplace. Set your own prices and keep 100% of upfront fees. We handle trials, billing, and infrastructure.
                            </p>
                            <p>
                                Every workflow includes 20 free trial executions. After trials, customers pay usage fees (5¢–25¢ per run) to the platform. You focus on building great workflows.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link to="/signup">
                                <Button className="bg-white text-black hover:bg-white/90 h-12 px-8 text-base font-semibold rounded-none">
                                    Join the Waitlist
                                </Button>
                            </Link>
                            <Link to="/missions">
                                <Button variant="outline" className="h-12 px-8 text-base font-semibold border-white/20 hover:bg-white/5 rounded-none text-white">
                                    See Live Workflows
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Right: Terminal Visual */}
                    <div className="relative">
                        <div className="rounded-sm border border-white/10 bg-black w-full max-w-xl ml-auto">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                                </div>
                                <div className="ml-4 text-xs font-mono text-muted-foreground">terminal</div>
                            </div>
                            <div className="p-6 font-mono text-sm leading-relaxed text-[#eee]">
                                <div className="flex gap-2">
                                    <span className="text-white">$</span>
                                    <span>people mission init</span>
                                </div>
                                <div className="text-muted-foreground">{'>'} Mission name: AI Email Summarizer</div>
                                <div className="text-muted-foreground">{'>'} Price: $29 (one-time)</div>
                                <div className="text-muted-foreground">{'>'} Complexity tier: Heavy (25¢/run)</div>
                                <div className="text-green-500">✓ Published to marketplace!</div>
                                <div className="animate-pulse inline-block w-2 H-4 bg-white/50 ml-1">_</div>
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
                                <div className="text-white font-mono mb-4">{'>_'}</div>
                                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">people CLI</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Publish workflows directly from your terminal with interactive prompts for pricing and configuration.
                                </p>
                            </div>
                        </div>

                        <div className="p-10 rounded-sm border border-white/10 bg-black hover:border-white/20 transition-colors h-full flex flex-col justify-between group">
                            <div>
                                <div className="text-white font-mono mb-4">{'</>'}</div>
                                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">TypeScript SDK</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Full TypeScript support with autocomplete, type safety, and built-in validation.
                                </p>
                            </div>
                        </div>

                        <div className="p-10 rounded-sm border border-white/10 bg-black hover:border-white/20 transition-colors h-full flex flex-col justify-between group">
                            <div>
                                <div className="text-white font-mono mb-4">⚡</div>
                                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">Local Testing</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Test workflows locally with mock data before publishing to the marketplace.
                                </p>
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="p-10 rounded-sm border border-white/10 bg-black hover:border-white/20 transition-colors h-full flex flex-col justify-between group">
                            <div>
                                <div className="text-white font-mono mb-4">📈</div>
                                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">Analytics Dashboard</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Track installations, executions, revenue, and customer feedback in real-time.
                                </p>
                            </div>
                        </div>

                        <div className="p-10 rounded-sm border border-white/10 bg-black hover:border-white/20 transition-colors h-full flex flex-col justify-between group">
                            <div>
                                <div className="text-white font-mono mb-4">{'</>'}</div>
                                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">Integration Registry</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Access 15+ pre-built integrations (Notion, Slack, Zoom, Stripe, GitHub, and more) for your workflows.
                                </p>
                            </div>
                        </div>

                        <div className="p-10 rounded-sm border border-white/10 bg-black hover:border-white/20 transition-colors h-full flex flex-col justify-between group">
                            <div>
                                <div className="text-white font-mono mb-4">{'>_'}</div>
                                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">Hot Reload</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Instant updates during development with automatic reloading of workflow changes.
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
