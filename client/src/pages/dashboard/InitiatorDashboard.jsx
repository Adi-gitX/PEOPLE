import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InitiatorDashboard() {
    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter mb-2">My Missions</h1>
                    <p className="text-muted-foreground">Manage your active problems and teams.</p>
                </div>
                <Link to="/missions/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Start New Mission
                    </Button>
                </Link>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
                <h3 className="text-lg font-medium mb-2">No active missions</h3>
                <p className="text-muted-foreground mb-6">You haven't submitted any problems yet.</p>
                <Link to="/missions/new">
                    <Button variant="outline">Create your first Mission</Button>
                </Link>
            </div>
        </DashboardLayout>
    );
}
