import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { useMission } from '../../hooks/useApi';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
    CheckCircle2, Clock, Globe, Shield, Users, ArrowLeft, Star, Zap,
    ChevronRight, Play, Box, Loader2, AlertCircle, Send
} from 'lucide-react';

export default function MissionDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, role } = useAuthStore();
    const { data, loading, error } = useMission(id);
    const [applying, setApplying] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applicationData, setApplicationData] = useState({
        coverLetter: '',
        proposedTimeline: '',
        proposedApproach: '',
    });

    const mission = data?.mission || data;

    const handleApply = async () => {
        if (!isAuthenticated) {
            toast.error('Please log in to apply');
            navigate('/login');
            return;
        }

        if (role !== 'contributor') {
            toast.error('Only contributors can apply to missions');
            return;
        }

        setApplying(true);
        try {
            await api.post(`/api/v1/missions/${id}/apply`, applicationData);
            toast.success('Application submitted!');
            setShowApplyModal(false);
        } catch (error) {
            toast.error(error.message || 'Failed to apply');
        } finally {
            setApplying(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />
                <div className="flex items-center justify-center pt-40">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
            </div>
        );
    }


    if (error || !mission) {
        // Fallback to mock mission for demo
        const mockMission = {
            title: "AI Meeting Intelligence",
            description: "Build a system to automatically extract action items and sentiment from Zoom transcripts. This mission involves building the pipeline that connects Zoom webhooks, processes audio via Whisper/GPT-4, and formats the output for a structured Notion database.",
            type: "backend",
            complexity: "hard",
            budgetMin: 1500,
            budgetMax: 2500,
            estimatedDurationDays: 14,
            requiredSkills: ["Python", "OpenAI", "Node.js"],
            initiatorName: "TechFlow Corp",
            status: "open",
        };

        return (
            <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
                <Navbar />
                <div className="pt-24 pb-20 px-6 max-w-[1400px] mx-auto">
                    <Link to="/explore" className="inline-flex items-center text-sm text-neutral-500 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Marketplace
                    </Link>

                    <div className="p-6 mb-8 rounded-lg border border-yellow-500/20 bg-yellow-500/5 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm text-yellow-400">This is demo data. Create missions via the Initiator dashboard.</span>
                    </div>

                    {renderMissionContent(mockMission, showApplyModal, setShowApplyModal, handleApply, applying, applicationData, setApplicationData, isAuthenticated, role)}
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
            <Navbar />

            <div className="pt-24 pb-20 px-6 max-w-[1400px] mx-auto">

                <Link to="/explore" className="inline-flex items-center text-sm text-neutral-500 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Marketplace
                </Link>

                {renderMissionContent(mission, showApplyModal, setShowApplyModal, handleApply, applying, applicationData, setApplicationData, isAuthenticated, role)}
            </div>
            <Footer />
        </div>
    );
}

function renderMissionContent(mission, showApplyModal, setShowApplyModal, handleApply, applying, applicationData, setApplicationData, isAuthenticated, role) {
    return (
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">

            <div className="space-y-6">

                <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                    <div className="flex gap-6">
                        <div className="w-16 h-16 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold tracking-tighter text-white">{mission.title}</h1>
                            <p className="text-lg text-neutral-400">by {mission.initiatorName || 'Anonymous'}</p>

                            <div className="flex items-center gap-6 text-sm text-neutral-500 pt-2">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{mission.estimatedDurationDays || 14} days</span>
                                </div>
                                <div className="flex items-center gap-1.5 capitalize">
                                    <Box className="w-4 h-4" />
                                    <span>{mission.type}</span>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-xs capitalize border ${mission.status === 'open' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    mission.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                                    }`}>
                                    {mission.status?.replace('_', ' ') || 'Open'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                    <h2 className="text-xl font-bold tracking-tight mb-4">About this Mission</h2>
                    <p className="text-neutral-400 leading-relaxed text-sm whitespace-pre-wrap">
                        {mission.description || mission.problemStatement}
                    </p>
                </div>


                {mission.successCriteria && (
                    <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                        <h2 className="text-xl font-bold tracking-tight mb-4">Success Criteria</h2>
                        <p className="text-neutral-400 leading-relaxed text-sm whitespace-pre-wrap">
                            {mission.successCriteria}
                        </p>
                    </div>
                )}


                {(mission.requiredSkills || []).length > 0 && (
                    <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                        <h2 className="text-xl font-bold tracking-tight mb-6">Required Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {mission.requiredSkills.map((skill, idx) => (
                                <span key={idx} className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm border border-blue-500/20">
                                    {typeof skill === 'string' ? skill : skill.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}


                <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                    <h2 className="text-xl font-bold tracking-tight mb-6">Details</h2>
                    <div className="grid grid-cols-3 gap-8">
                        <div>
                            <div className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">Complexity</div>
                            <div className="text-2xl font-bold tracking-tight text-white capitalize">
                                {mission.complexity || 'Medium'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">Duration</div>
                            <div className="text-2xl font-bold tracking-tight text-white flex items-baseline gap-1">
                                {mission.estimatedDurationDays || 14}<span className="text-sm text-neutral-500 font-normal">days</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">Type</div>
                            <div className="text-2xl font-bold tracking-tight text-white capitalize">{mission.type}</div>
                        </div>
                    </div>
                </div>
            </div>


            <div className="space-y-6">

                <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                    <div className="text-center mb-6">
                        <div className="text-4xl font-bold tracking-tight mb-1 text-white">
                            ${mission.budgetMin?.toLocaleString()} - ${mission.budgetMax?.toLocaleString()}
                        </div>
                        <div className="text-sm text-neutral-500">budget range</div>
                    </div>

                    <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.08] mb-6 text-center">
                        <div className="text-sm font-medium text-white mb-1 flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            Escrow Protected
                        </div>
                        <div className="text-xs text-neutral-500">Funds secured on milestone approval</div>
                    </div>

                    {mission.status === 'open' && (
                        <>
                            {isAuthenticated && role === 'contributor' ? (
                                <Button
                                    className="w-full h-12 bg-white text-black font-semibold hover:bg-neutral-200 transition-colors"
                                    onClick={() => setShowApplyModal(true)}
                                >
                                    Apply to Mission
                                </Button>
                            ) : isAuthenticated && role === 'initiator' ? (
                                <p className="text-xs text-center text-neutral-600 py-4">
                                    Switch to Contributor account to apply
                                </p>
                            ) : (
                                <Link to="/signup">
                                    <Button className="w-full h-12 bg-white text-black font-semibold hover:bg-neutral-200 transition-colors">
                                        Sign Up to Apply
                                    </Button>
                                </Link>
                            )}
                            <p className="text-xs text-center text-neutral-600 mt-3 px-4">
                                Make sure your profile is complete before applying
                            </p>
                        </>
                    )}

                    {mission.status !== 'open' && (
                        <div className="text-center py-4">
                            <span className="text-sm text-neutral-500">This mission is {mission.status?.replace('_', ' ')}</span>
                        </div>
                    )}
                </div>


                <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0A0A0A]">
                    <h3 className="text-sm font-bold text-white mb-4">Created by</h3>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-white text-black font-bold flex items-center justify-center text-sm">
                            {(mission.initiatorName || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-white">@{mission.initiatorName || 'Anonymous'}</span>
                                <CheckCircle2 className="w-3 h-3 text-blue-500" />
                            </div>
                            <div className="text-xs text-neutral-500">Verified Initiator</div>
                        </div>
                    </div>
                </div>
            </div>


            {showApplyModal && (
                <>
                    <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setShowApplyModal(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-lg p-6 animate-in zoom-in-95">
                            <h2 className="text-xl font-bold mb-4">Apply to Mission</h2>
                            <p className="text-sm text-zinc-500 mb-6">Tell the initiator why you're the right fit</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-zinc-400 mb-1 block">Cover Letter *</label>
                                    <textarea
                                        value={applicationData.coverLetter}
                                        onChange={(e) => setApplicationData(prev => ({ ...prev, coverLetter: e.target.value }))}
                                        placeholder="Why are you interested in this mission? What makes you a good fit?"
                                        rows={4}
                                        className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg text-sm resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-zinc-400 mb-1 block">Proposed Timeline</label>
                                    <input
                                        type="text"
                                        value={applicationData.proposedTimeline}
                                        onChange={(e) => setApplicationData(prev => ({ ...prev, proposedTimeline: e.target.value }))}
                                        placeholder="e.g., 2 weeks for MVP"
                                        className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-zinc-400 mb-1 block">Proposed Approach</label>
                                    <textarea
                                        value={applicationData.proposedApproach}
                                        onChange={(e) => setApplicationData(prev => ({ ...prev, proposedApproach: e.target.value }))}
                                        placeholder="How would you approach this mission?"
                                        rows={3}
                                        className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg text-sm resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button variant="outline" onClick={() => setShowApplyModal(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button onClick={handleApply} isLoading={applying} className="flex-1">
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit Application
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
