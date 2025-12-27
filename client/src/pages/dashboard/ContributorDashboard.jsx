import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import { CheckCircle2, TrendingUp, Award, Clock, Shield, Search, Loader2, ArrowUpRight, Zap, RefreshCw } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const MATCHING_TIMELINE = [
    {
        id: 1,
        stage: "Profile Analysis",
        status: "completed",
        time: "10:42 AM",
        detail: "Skills & Reputation verified"
    },
    {
        id: 2,
        stage: "Algorithmic Matching",
        status: "processing",
        time: "Now",
        detail: "Scanning 142 active missions..."
    },
    {
        id: 3,
        stage: "Client Review",
        status: "pending",
        time: "-",
        detail: "Waiting for match confirmation"
    }
];

export default function ContributorDashboard() {
    const [isLooking, setIsLooking] = useState(false);
    const [matchPower, setMatchPower] = useState(65);

    // Provide immediate feedback on toggle
    const handleToggle = (checked) => {
        setIsLooking(checked);
        if (checked) {
            toast.success("Active Status Enabled", {
                description: "You are now visible to the algorithmic matching engine."
            });
        }
    };

    const handleAction = (action) => {
        toast.info("Module Loading", {
            description: `Initializing ${action} module...`
        });
    };

    return (
        <DashboardLayout>
            <Toaster theme="dark" position="bottom-right" />
            <div className="flex flex-col gap-10">

                {/* 1. Header & Main Toggle */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter mb-2 text-white">Work Status</h1>
                        <p className="text-neutral-400 text-lg">Input your availability. Let the algorithm do the work.</p>
                    </div>

                    <div className="flex items-center gap-6 p-1">
                        <div className="flex items-center gap-4 bg-[#0A0A0A] p-2 pr-6 pl-6 rounded-full border border-white/[0.08]">
                            <div className="text-right mr-2">
                                <div className={`font-bold transition-colors tracking-tight ${isLooking ? 'text-green-400' : 'text-neutral-400'}`}>
                                    {isLooking ? 'Looking for Work' : 'Incognito'}
                                </div>
                            </div>
                            <Switch
                                checked={isLooking}
                                onCheckedChange={handleToggle}
                                className="scale-110 data-[state=checked]:bg-green-500"
                            />
                        </div>
                    </div>
                </div>

                {isLooking ? (
                    <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 2. Left: Matching Engine Visual */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Status Card */}
                            <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A] relative overflow-hidden group">
                                {/* Removed Blur */}

                                <div className="flex items-center gap-5 mb-10 relative z-10">
                                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white tracking-tight">Matching Engine Active</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <p className="text-neutral-400 font-mono text-xs uppercase tracking-wider">Real-time Scanning</p>
                                        </div>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <div className="text-2xl font-bold text-white tracking-tighter">~4h</div>
                                        <div className="text-xs text-neutral-500 font-mono">EST. WAIT</div>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-0 relative z-10">
                                    {MATCHING_TIMELINE.map((step, idx) => (
                                        <div key={step.id} className="relative flex gap-6 pb-8 last:pb-0 group">
                                            {/* Connector Line */}
                                            {idx !== MATCHING_TIMELINE.length - 1 && (
                                                <div className="absolute left-[19px] top-8 bottom-0 w-px bg-white/[0.08]" />
                                            )}

                                            <div className={`
                                                relative z-10 w-10 h-10 rounded-full border border-black flex items-center justify-center shrink-0 transition-all duration-500
                                                ${step.status === 'completed' ? 'bg-green-500 text-black' :
                                                    step.status === 'processing' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-[#111] border-white/10 text-neutral-600'}
                                            `}>
                                                {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                                                    step.status === 'processing' ? <RefreshCw className="w-4 h-4 animate-spin" /> :
                                                        <Clock className="w-4 h-4" />}
                                            </div>
                                            <div className="pt-1">
                                                <div className={`font-medium tracking-tight text-lg mb-1 ${step.status === 'pending' ? 'text-neutral-500' : 'text-white'}`}>
                                                    {step.stage}
                                                </div>
                                                <div className="text-sm text-neutral-500">{step.detail}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. Right: Match Power & Stats */}
                        <div className="space-y-6">
                            <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20">
                                            <Zap className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <h3 className="font-bold text-white tracking-tight">Match Power</h3>
                                    </div>
                                    <span className="font-mono text-2xl font-bold text-purple-400 tracking-tighter">{matchPower}%</span>
                                </div>
                                <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden mb-6">
                                    <div
                                        className="h-full bg-purple-500 transition-all duration-1000 relative"
                                        style={{ width: `${matchPower}%` }}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-black border border-white/[0.08]">
                                        <span className="text-neutral-300">Identity Verification</span>
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-black border border-white/[0.08] group hover:border-white/20 transition-colors">
                                        <span className="text-neutral-300">Background Check</span>
                                        <button onClick={() => handleAction('Background Check')} className="text-xs font-medium text-white px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors">Start</button>
                                    </div>
                                    <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-black border border-white/[0.08] group hover:border-white/20 transition-colors">
                                        <span className="text-neutral-300">Skills Assessment</span>
                                        <button onClick={() => handleAction('Skill Assessment')} className="text-xs font-medium text-white px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors">Retake</button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0A0A0A] flex items-center justify-between">
                                <div>
                                    <div className="text-neutral-400 text-xs font-mono uppercase tracking-wider mb-1">Active Missions</div>
                                    <div className="text-2xl font-bold text-white tracking-tight">142</div>
                                </div>
                                <div className="h-10 w-px bg-white/[0.08]" />
                                <div>
                                    <div className="text-neutral-400 text-xs font-mono uppercase tracking-wider mb-1">Avg Ticket</div>
                                    <div className="text-2xl font-bold text-white tracking-tight">$1.2k</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-[#0A0A0A] border border-white/[0.08] rounded-full flex items-center justify-center mb-8 relative group">
                            <Shield className="w-10 h-10 text-neutral-600 group-hover:text-white transition-colors duration-500" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tighter text-white">You are Incognito</h2>
                        <p className="text-neutral-400 text-lg max-w-xl mb-10 leading-relaxed">
                            Your profile is hidden. Toggle status to "Looking for Work" to begin receiving curated mission invites.
                        </p>
                        <Button
                            size="lg"
                            className="bg-white text-black hover:bg-neutral-200 h-12 px-8 text-base font-semibold transition-all"
                            onClick={() => handleToggle(true)}
                        >
                            Start Looking for Work
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
