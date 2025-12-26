import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';

export default function ContributorApplication() {
    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-xs font-medium text-muted-foreground mb-4">
                        Step 1 of 3: Reasoning
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter mb-4">Entrance Verification</h1>
                    <p className="text-muted-foreground text-lg">
                        We don't care about your resume. We care about how you think.
                        <br />
                        Solve the following real-world scenario to proceed.
                    </p>
                </div>

                <div className="space-y-8">
                    <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                        <h3 className="font-bold mb-4 text-white">Scenario: The Race Condition</h3>
                        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                            You are building a payment processing system. A user reports that if they click the "Pay" button twice effectively instantly, they are charged twice, but the system only records one transaction ID. The database is PostgreSQL. The API is Node.js.
                        </p>
                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            Explain two distinct ways to prevent this at the architectural level, and choose which one is better for a high-volume system.
                        </p>

                        <textarea
                            className="w-full h-40 bg-black border border-white/10 rounded-md p-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                            placeholder="Type your reasoning here..."
                        ></textarea>
                    </div>

                    <div className="flex justify-end">
                        <Button size="lg">Submit Reasoning</Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
