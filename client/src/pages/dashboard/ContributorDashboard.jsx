import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';

export default function ContributorDashboard() {
    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter mb-2">Work Graph</h1>
                    <p className="text-muted-foreground">Your contribution history and reputation.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Trust Level</div>
                    <div className="text-2xl font-bold">Entry</div>
                </div>
                <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Missions Completed</div>
                    <div className="text-2xl font-bold">0</div>
                </div>
                <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Active Roles</div>
                    <div className="text-2xl font-bold text-muted-foreground">-</div>
                </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
                <h3 className="text-lg font-medium mb-2">Ready to work?</h3>
                <p className="text-muted-foreground mb-6">Complete the entrance reasoning tasks to verify your skills.</p>
                <Button>Start Entrance Exam</Button>
            </div>
        </DashboardLayout>
    );
}
