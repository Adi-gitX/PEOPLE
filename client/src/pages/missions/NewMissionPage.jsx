import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';

export default function NewMissionPage() {
    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tighter mb-2">Initialize a Mission</h1>
                <p className="text-muted-foreground mb-8">Describe the problem you need solved. We'll assemble the team.</p>

                <form className="space-y-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mission Title</label>
                            <input type="text" placeholder="e.g. Build a React-based Analytics Dashboard" className="flex h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Problem Statement</label>
                            <textarea placeholder="Describe the core problem and desired outcome..." className="flex min-h-[150px] w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Success Criteria</label>
                            <textarea placeholder="How will we know this mission is successful?" className="flex min-h-[100px] w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Budget Range</label>
                                <select className="flex h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20">
                                    <option value="">Select range...</option>
                                    <option value="small">$500 - $1k</option>
                                    <option value="medium">$1k - $5k</option>
                                    <option value="large">$5k+</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Expected Timeline</label>
                                <select className="flex h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20">
                                    <option value="">Select duration...</option>
                                    <option value="1week">1 Week</option>
                                    <option value="1month">1 Month</option>
                                    <option value="ongoing">Ongoing</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex justify-end gap-4">
                        <Button variant="outline" type="button">Save Draft</Button>
                        <Button type="submit">Initialize Mission</Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
