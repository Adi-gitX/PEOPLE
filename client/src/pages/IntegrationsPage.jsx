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
        color: "text-white",
        bg: "group-hover:bg-white/10"
    },
    {
        id: 2,
        name: "Slack",
        category: "Communication",
        description: "Real-time updates for mission milestones, blockers, and team chats.",
        icon: Slack,
        color: "text-[#E01E5A]",
        bg: "group-hover:bg-[#E01E5A]/10"
    },
    {
        id: 3,
        name: "Figma",
        category: "Design",
        description: "Embed live design files and prototypes for seamless UI/UX reviews.",
        icon: Layout,
        color: "text-[#F24E1E]",
        bg: "group-hover:bg-[#F24E1E]/10"
    },
    {
        id: 4,
        name: "Supabase",
        category: "Database",
        description: "Instant backend provisioning and database management for quick MVPs.",
        icon: Database,
        color: "text-[#3ECF8E]",
        bg: "group-hover:bg-[#3ECF8E]/10"
    },
    {
        id: 5,
        name: "Stripe",
        category: "Payments",
        description: "Secure escrow funding and automated milestone payouts.",
        icon: Shield,
        color: "text-[#635BFF]",
        bg: "group-hover:bg-[#635BFF]/10"
    },
    {
        id: 6,
        name: "Vercel",
        category: "Deployment",
        description: "Automated deployments and previews for every pull request.",
        icon: Globe,
        color: "text-white",
        bg: "group-hover:bg-white/10"
    }
];

export default function IntegrationsPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="mb-16">
                    <h1 className="text-5xl font-bold tracking-tighter mb-6">Integrations</h1>
                    <p className="text-muted-foreground text-xl max-w-2xl leading-relaxed">
                        Seamlessly connect your favorite tools. Automate workflows and focus on execution.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {INTEGRATIONS.map((tool) => (
                        <div key={tool.id} className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-8 hover:border-white/20 transition-all duration-500 overflow-hidden">

                            <div className={`absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none ${tool.bg} blur-3xl`} />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="p-4 rounded-xl bg-black border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                        <tool.icon className={`h-8 w-8 ${tool.color}`} />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 border border-white/5 px-2 py-1 rounded bg-white/5">
                                        {tool.category}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-bold mb-3 tracking-tight">{tool.name}</h3>
                                <p className="text-muted-foreground leading-relaxed mb-8 min-h-[48px]">
                                    {tool.description}
                                </p>

                                <div className="flex items-center text-sm font-bold text-white opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                    Configure Integration
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
}
