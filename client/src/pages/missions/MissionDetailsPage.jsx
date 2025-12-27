import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Clock, Globe, Shield, Users, ArrowLeft, Star, Zap, ChevronRight, Play, Box } from 'lucide-react';

export default function MissionDetailsPage() {
    const { id } = useParams();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
            <Navbar />

            <div className="pt-24 pb-20 px-6 max-w-[1400px] mx-auto">
                {/* Breadcrumb */}
                <Link to="/explore" className="inline-flex items-center text-sm text-neutral-500 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Marketplace
                </Link>

                <div className="grid lg:grid-cols-[1fr_400px] gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Header Card */}
                        <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                            <div className="flex gap-6">
                                <div className="w-16 h-16 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
                                    <Zap className="w-8 h-8 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-4xl font-bold tracking-tighter text-white">Meeting Intelligence</h1>
                                    <p className="text-lg text-neutral-400">Zoom meetings that write their own notes</p>

                                    <div className="flex items-center gap-6 text-sm text-neutral-500 pt-2">
                                        <div className="flex items-center gap-1.5 text-yellow-500">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="font-medium text-white">5.0</span>
                                            <span className="text-neutral-500">(12 reviews)</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4" />
                                            <span>24 active</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" />
                                            <span>5 min setup</span>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button className="px-3 py-1.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-neutral-300 hover:bg-white/[0.1] transition-colors flex items-center gap-2 w-fit">
                                            <Box className="w-3 h-3" />
                                            Integration
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* About Section */}
                        <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                            <h2 className="text-xl font-bold tracking-tight mb-4">About this workflow</h2>
                            <p className="text-neutral-400 leading-relaxed text-sm">
                                Automatically extract notes, action items, and summaries from Zoom meetings into Notion.
                                This mission involves building the pipeline that connects Zoom webhooks, processes audio via Whisper/GPT-4,
                                and formats the output for a structured Notion database.
                            </p>
                        </div>

                        {/* Requirements */}
                        <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                            <h2 className="text-xl font-bold tracking-tight mb-6">Requirements</h2>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-black border border-white/[0.08]">
                                    <div className="w-8 h-8 rounded bg-white/[0.05] flex items-center justify-center">
                                        <Globe className="w-4 h-4 text-neutral-400" />
                                    </div>
                                    <span className="font-medium text-sm">Zoom Pro Account</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-black border border-white/[0.08]">
                                    <div className="w-8 h-8 rounded bg-white/[0.05] flex items-center justify-center">
                                        <Box className="w-4 h-4 text-neutral-400" />
                                    </div>
                                    <span className="font-medium text-sm">Notion API Key</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-black border border-white/[0.08]">
                                    <div className="w-8 h-8 rounded bg-white/[0.05] flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-neutral-400" />
                                    </div>
                                    <span className="font-medium text-sm">OpenAI API Access</span>
                                </div>
                            </div>
                        </div>

                        {/* Performance */}
                        <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                            <h2 className="text-xl font-bold tracking-tight mb-6">Performance Targets</h2>
                            <div className="grid grid-cols-3 gap-8">
                                <div>
                                    <div className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">Avg Latency</div>
                                    <div className="text-2xl font-bold tracking-tight text-white flex items-baseline gap-1">
                                        12<span className="text-sm text-neutral-500 font-normal">s</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">Success Rate</div>
                                    <div className="text-2xl font-bold tracking-tight text-white flex items-baseline gap-1">
                                        99.9<span className="text-sm text-neutral-500 font-normal">%</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">Active Users</div>
                                    <div className="text-2xl font-bold tracking-tight text-white">4.2k</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="space-y-6">
                        {/* Bounty Card */}
                        <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                            <div className="text-center mb-6">
                                <div className="text-4xl font-bold tracking-tight mb-1 text-white">$2,500</div>
                                <div className="text-sm text-neutral-500">total bounty</div>
                            </div>

                            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.08] mb-6 text-center">
                                <div className="text-sm font-medium text-white mb-1 flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    Escrow Secured
                                </div>
                                <div className="text-xs text-neutral-500">Funds held by protocol</div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-400">Milestone 1</span>
                                    <span className="text-white font-mono">$500</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-400">MVP Release</span>
                                    <span className="text-white font-mono">$1,000</span>
                                </div>
                                <div className="flex justify-line text-sm border-t border-white/[0.08] pt-4 mt-2">
                                    <span className="text-neutral-400">Completion</span>
                                    <span className="text-white font-mono ml-auto">$1,000</span>
                                </div>
                            </div>

                            <Button disabled className="w-full h-12 bg-white text-black font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Auto-Matching Active
                            </Button>
                            <p className="text-xs text-center text-neutral-600 mt-3 px-4">
                                Toggle "Looking for Work" in dashboard to be considered.
                            </p>
                        </div>

                        {/* Creator Card */}
                        <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                            <h3 className="text-sm font-bold text-white mb-4">Created by</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-md bg-white text-black font-bold flex items-center justify-center text-sm">
                                    TC
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-white">@TechFlow</span>
                                        <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                    </div>
                                    <div className="text-xs text-neutral-500">Verified Initiator</div>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/[0.08] grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-medium text-white">12</div>
                                    <div className="text-xs text-neutral-500">Missions</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">$45k</div>
                                    <div className="text-xs text-neutral-500">Paid Out</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
