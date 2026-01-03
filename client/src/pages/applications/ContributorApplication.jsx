import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Terminal, Cpu, ArrowRight, Loader2 } from 'lucide-react';

export default function ContributorApplication() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answer, setAnswer] = useState('');

    const handleSubmit = async () => {
        if (!answer.trim()) return;

        setIsSubmitting(true);
        try {
            await api.post('/api/v1/contributors/me/verification', { analysis: answer });
            toast.success('Verification analysis submitted successfully');
            navigate('/dashboard/contributor');
        } catch (error) {
            console.error('Failed to submit verification:', error);
            toast.error('Failed to submit verification');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto pt-8">

                <div className="flex items-center justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-mono font-medium tracking-wide">
                                LEVEL 1 CLEARANCE
                            </div>
                            <span className="text-neutral-500 text-sm font-mono">ID: REF-9928-X</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tighter text-white">Entrance Verification</h1>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Time Remaining</span>
                            <span className="font-mono text-xl text-white">42:12</span>
                        </div>
                        <div className="w-px h-10 bg-white/[0.08]" />
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Session</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-white text-sm">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-300px)] min-h-[600px]">

                    <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0A] flex flex-col overflow-hidden">
                        <div className="border-b border-white/[0.08] px-6 py-4 flex items-center gap-3 bg-white/[0.02]">
                            <Terminal className="w-4 h-4 text-neutral-500" />
                            <span className="text-sm font-medium text-white">Scenario: The Race Condition</span>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="prose prose-invert max-w-none prose-p:text-neutral-400 prose-headings:text-white prose-strong:text-white">
                                <p className="leading-relaxed text-lg">
                                    You are building a high-volume payment processing system. A critical vulnerability has been detected where a user can inadvertently (or maliciously) trigger a double charge by clicking the "Pay" button twice effectively instantly.
                                </p>
                                <div className="my-8 p-6 rounded-lg bg-black border border-white/[0.08]">
                                    <div className="flex items-center gap-2 text-red-400 mb-2 font-mono text-sm">
                                        <Cpu className="w-4 h-4" />
                                        <span>System State</span>
                                    </div>
                                    <ul className="space-y-2 text-sm text-neutral-400 font-mono">
                                        <li>&gt; User initiates Transaction A (t=0ms)</li>
                                        <li>&gt; User initiates Transaction B (t=2ms)</li>
                                        <li>&gt; Database: PostgreSQL (Isolation: Read Committed)</li>
                                        <li>&gt; API: Node.js (Express)</li>
                                        <li>&gt; <span className="text-red-400">Result: Double Charge, Single Record ID (Failed State)</span></li>
                                    </ul>
                                </div>

                                <h3 className="text-lg font-bold">Your Task</h3>
                                <p>
                                    Explain two distinct architectural strategies to prevent this race condition.
                                    Compare them based on <strong>latency</strong> and <strong>consistency</strong> guarantees, and select the one best suited for a system handling 10k TPS.
                                </p>
                            </div>
                        </div>
                    </div>


                    <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0A] flex flex-col overflow-hidden relative group">
                        <div className="border-b border-white/[0.08] px-6 py-4 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                            </div>
                            <span className="text-xs font-mono text-neutral-600">analysis_buffer.md</span>
                        </div>

                        <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="flex-1 w-full bg-[#050505] p-8 text-neutral-300 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-white/[0.08] leading-relaxed selection:bg-white/20"
                            placeholder="Type your architectural analysis here..."
                            spellCheck="false"
                        />

                        <div className="p-6 border-t border-white/[0.08] bg-white/[0.02] flex justify-between items-center">
                            <span className="text-xs text-neutral-500 font-mono">
                                {answer.length} chars
                            </span>
                            <Button
                                onClick={handleSubmit}
                                disabled={!answer.trim() || isSubmitting}
                                className="bg-white text-black hover:bg-neutral-200 px-8 h-10 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        Submit Analysis
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
