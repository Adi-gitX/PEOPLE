import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ArrowRight, Github, Slack, Database, Mail, Globe, Layout, Shield } from 'lucide-react';

const INTEGRATIONS = [
    {
        id: 1,
        name: "GitHub",
        category: "Development",
        description: "Sync repositories, issues, and pull requests directly with mission deliverables.",
        icon: Github,
        color: "text-white"
    },
    {
        id: 2,
        name: "Slack",
        category: "Communication",
        description: "Real-time updates for mission milestones, blockers, and team chats.",
        icon: Slack,
        color: "text-[#E01E5A]"
    },
    {
        id: 3,
        name: "Figma",
        category: "Design",
        description: "Embed live design files and prototypes for seamless UI/UX reviews.",
        icon: Layout,
        color: "text-[#F24E1E]"
    },
    {
        id: 4,
        name: "Supabase",
        category: "Database",
        description: "Instant backend provisioning and database management for quick MVPs.",
        icon: Database,
        color: "text-[#3ECF8E]"
    },
    {
        id: 5,
        name: "Stripe",
        category: "Payments",
        description: "Secure escrow funding and automated milestone payouts.",
        icon: Shield,
        color: "text-[#635BFF]"
    },
    {
        id: 6,
        name: "Vercel",
        category: "Deployment",
        description: "Automated deployments and previews for every pull request.",
        icon: Globe,
        color: "text-white"
    }
];

export default function IntegrationsPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tighter mb-4">Integrations</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Connect your favorite tools to streamline mission execution and collaboration.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {INTEGRATIONS.map((tool) => (
                        <div key={tool.id} className="group rounded-xl border border-white/10 bg-white/5 p-8 hover:border-white/20 transition-all hover:bg-white/[0.07]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 rounded-lg bg-black border border-white/10">
                                    <tool.icon className={`h-6 w-6 ${tool.color}`} />
                                </div>
                                <span className="text-xs font-mono text-muted-foreground border border-white/10 px-2 py-1 rounded">
                                    {tool.category}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold mb-2">{tool.name}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed mb-6 min-h-[40px]">
                                {tool.description}
                            </p>

                            <div className="flex items-center text-sm font-medium text-white group-hover:text-blue-400 transition-colors cursor-pointer">
                                Configure
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
}
