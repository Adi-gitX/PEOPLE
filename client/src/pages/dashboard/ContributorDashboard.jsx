import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import { CheckCircle2, TrendingUp, Award, Clock, Shield, Search, Loader2 } from 'lucide-react';

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

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8">

                {/* 1. Header & Main Toggle */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-1 border-b border-white/5 pb-8">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter mb-2 text-white">Work Status</h1>
                        <p className="text-muted-foreground text-lg">Input your availability. Let the algorithm do the work.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/[0.03] backdrop-blur-sm p-4 rounded-xl border border-white/10 shadow-lg">
                        <div className="text-right mr-2">
                            <div className={`font-bold transition-colors tracking-tight ${isLooking ? 'text-green-400' : 'text-zinc-400'}`}>
                                {isLooking ? 'Looking for Work' : 'Incognito'}
                            </div>
                            <div className="text-xs text-muted-foreground/80">
                                {isLooking ? 'Visible to matching engine' : 'Hidden from initiators'}
                            </div>
                        </div>
                        <Switch
                            checked={isLooking}
                            onCheckedChange={setIsLooking}
                            className="scale-125 data-[state=checked]:bg-green-500"
                        />
                    </div>
                </div>

                {isLooking ? (
                    <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* 2. Left: Matching Engine Visual */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Status Card */}
                            <div className="p-8 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-transparent relative overflow-hidden ring-1 ring-white/5">
                                {/* Ambient Glow */}
                                <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />

                                <div className="flex items-center gap-5 mb-8 relative z-10">
                                    <div className="p-4 bg-blue-500/10 rounded-full animate-pulse ring-1 ring-blue-500/20">
                                        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white tracking-tight">Analyzing mission scope...</h3>
                                        <p className="text-blue-200/60 font-mono text-sm mt-1">ESTIMATED WAIT: ~4 HOURS</p>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-8 relative pl-2 z-10">
                                    <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-white/20 to-transparent" />

                                    {MATCHING_TIMELINE.map((step) => (
                                        <div key={step.id} className="relative flex gap-6 items-start group">
                                            <div className={`
                                                relative z-10 w-10 h-10 rounded-full border-4 border-[#0a0a0a] flex items-center justify-center shrink-0 shadow-lg transition-all duration-500
                                                ${step.status === 'completed' ? 'bg-green-500 text-black scale-100' :
                                                    step.status === 'processing' ? 'bg-blue-600 text-white animate-pulse scale-110 shadow-blue-500/20' : 'bg-zinc-900 border-zinc-800 text-muted-foreground'}
                                            `}>
                                                {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                                                    step.status === 'processing' ? <Search className="w-4 h-4" /> :
                                                        <Clock className="w-4 h-4" />}
                                            </div>
                                            <div className="pt-2">
                                                <div className={`font-medium tracking-tight text-lg ${step.status === 'pending' ? 'text-muted-foreground' : 'text-white'}`}>
                                                    {step.stage}
                                                </div>
                                                <div className="text-sm text-muted-foreground/60">{step.detail}</div>
                                            </div>
                                            <div className="ml-auto text-xs text-muted-foreground/40 pt-3 font-mono">
                                                {step.time}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. Right: Match Power & Stats */}
                        <div className="space-y-6">
                            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold flex items-center gap-2 text-white tracking-tight">
                                        <Shield className="w-5 h-5 text-purple-400" />
                                        Match Power
                                    </h3>
                                    <span className="font-mono text-3xl font-bold text-purple-400 tracking-tighter">{matchPower}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-6 ring-1 ring-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000 relative"
                                        style={{ width: `${matchPower}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                    Your profile strength directly affects your match frequency. Complete verifications to boost visibility.
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                                        <span className="text-gray-300">Identity Verification</span>
                                        <span className="text-green-400 flex items-center gap-1 font-medium"><CheckCircle2 className="w-3 h-3" /> Done</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-white/5 border border-white/5 hover:border-yellow-500/30 transition-colors">
                                        <span className="text-gray-300">Background Check</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-yellow-500 text-xs font-medium">Pending</span>
                                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-3 border-white/10 hover:bg-white/10">Start</Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors">
                                        <span className="text-gray-300">Skills Assessment</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-400 text-xs font-medium">Low Score</span>
                                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-3 border-white/10 hover:bg-white/10">Retake</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent text-center">
                                <h3 className="font-bold mb-2 text-white tracking-tight">Active Queue</h3>
                                <div className="py-6 flex flex-col items-center justify-center">
                                    <div className="relative mb-4">
                                        <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                                        <Clock className="w-10 h-10 text-white/40 relative z-10" />
                                    </div>
                                    <p className="text-muted-foreground text-sm max-w-[200px] leading-relaxed">
                                        Scanning <span className="text-white font-bold">142</span> active missions for your profile match...
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in-95 duration-700">
                        <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mb-8 relative group">
                            <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <Shield className="w-10 h-10 text-muted-foreground/40 group-hover:text-white/60 transition-colors duration-500" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tighter text-white">You are Incognito</h2>
                        <p className="text-muted-foreground text-lg max-w-xl mb-10 leading-relaxed">
                            Your profile is hidden from the algorithmic matching engine. Toggle status to "Looking for Work" to begin receiving curated mission invites.
                        </p>
                        <Button
                            size="lg"
                            className="bg-white text-black hover:bg-zinc-200 h-14 px-10 text-lg font-semibold rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300"
                            onClick={() => setIsLooking(true)}
                        >
                            Start Looking for Work
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
