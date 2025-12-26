import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, TrendingUp, Award, Clock } from 'lucide-react';

const RECENT_ACTIVITY = [
    {
        id: 1,
        action: "Reasoning Task Submitted",
        mission: "Entrance Verification",
        date: "2 hours ago",
        status: "Pending Review"
    },
    {
        id: 2,
        action: "Profile Created",
        mission: "-",
        date: "1 day ago",
        status: "Completed"
    }
];

export default function ContributorDashboard() {
    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter mb-2">Work Graph</h1>
                    <p className="text-muted-foreground">Your contribution history and reputation.</p>
                </div>
                <Button>Start Entrance Exam</Button>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="p-6 rounded-xl border border-white/10 bg-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Award className="w-12 h-12" />
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">Trust Level</div>
                    <div className="text-3xl font-bold">Entry</div>
                    <div className="text-xs text-muted-foreground mt-2">Complete 1 mission to upgrade</div>
                </div>
                <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Missions Completed</div>
                    <div className="text-3xl font-bold">0</div>
                </div>
                <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Earnings</div>
                    <div className="text-3xl font-bold text-green-400">$0.00</div>
                </div>
                <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Acceptance Rate</div>
                    <div className="text-3xl font-bold text-muted-foreground">-</div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Available Missions */}
                <div className="md:col-span-2 space-y-6">
                    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="font-bold">Recommended Missions</h3>
                            <Button variant="link" className="text-xs text-muted-foreground">View All</Button>
                        </div>
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4">
                                <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Unlock Missions</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                You need to pass the entrance verification to view and bid on real missions.
                            </p>
                            <Button variant="outline">Continue Verification</Button>
                        </div>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 h-full">
                        <h3 className="font-bold mb-6">Recent Activity</h3>
                        <div className="space-y-6">
                            {RECENT_ACTIVITY.map((activity) => (
                                <div key={activity.id} className="relative pl-6 pb-6 border-l border-white/10 last:pb-0 last:border-0">
                                    <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-black" />
                                    <div className="text-sm font-medium mb-1">{activity.action}</div>
                                    <div className="text-xs text-muted-foreground mb-2">{activity.mission}</div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">{activity.date}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${activity.status === 'Completed'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                            {activity.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
