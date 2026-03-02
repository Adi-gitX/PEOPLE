import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSkills } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { User, Github, Linkedin, Globe, Clock, Save, X, Building2, BriefcaseBusiness, Trash2, MoveUp, MoveDown, Star } from 'lucide-react';

const normalizeOptionalUrl = (value) => {
    const trimmed = (value || '').trim();
    return trimmed ? trimmed : null;
};

const normalizeOptionalString = (value) => {
    const trimmed = (value || '').trim();
    return trimmed ? trimmed : undefined;
};

const parseCsv = (value) => {
    if (!value) return [];
    return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
};

const ProfileSettings = () => {
    const { user, profile, role, refreshProfile } = useAuthStore();
    const isAdmin = role === 'admin';
    const hasContributorWorkspace = !isAdmin;
    const hasInitiatorWorkspace = !isAdmin;

    const { skills: availableSkills, loading: skillsLoading } = useSkills();

    const [commonData, setCommonData] = useState({
        fullName: '',
        avatarUrl: '',
    });

    const [contributorData, setContributorData] = useState({
        headline: '',
        bio: '',
        githubUrl: '',
        linkedinUrl: '',
        portfolioUrl: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        availabilityHoursPerWeek: 20,
    });

    const [initiatorData, setInitiatorData] = useState({
        companyName: '',
        companyUrl: '',
        companySize: '',
        industry: '',
    });

    const [loading, setLoading] = useState(false);
    const [contributorProfile, setContributorProfile] = useState(null);
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [portfolioLoading, setPortfolioLoading] = useState(false);
    const [portfolioSaving, setPortfolioSaving] = useState(false);
    const [editingPortfolioId, setEditingPortfolioId] = useState('');
    const [portfolioForm, setPortfolioForm] = useState({
        title: '',
        summary: '',
        role: '',
        skillsCsv: '',
        outcome: '',
        projectUrl: '',
        externalLinksCsv: '',
        imageUrlsCsv: '',
        featured: false,
    });

    useEffect(() => {
        setCommonData({
            fullName: user?.displayName || '',
            avatarUrl: user?.photoURL || '',
        });
    }, [user]);

    const loadContributorProfile = useCallback(async () => {
        if (!hasContributorWorkspace) return;
        try {
            const response = await api.get('/api/v1/contributors/me');
            const contributor = response.data?.profile || null;
            setContributorProfile(contributor);
            if (contributor) {
                setContributorData({
                    headline: contributor.headline || '',
                    bio: contributor.bio || '',
                    githubUrl: contributor.githubUrl || '',
                    linkedinUrl: contributor.linkedinUrl || '',
                    portfolioUrl: contributor.portfolioUrl || '',
                    timezone: contributor.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                    availabilityHoursPerWeek: contributor.availabilityHoursPerWeek ?? 20,
                });
            }
        } catch {
            setContributorProfile(null);
        }
    }, [hasContributorWorkspace]);

    const loadInitiatorProfile = useCallback(async () => {
        if (!hasInitiatorWorkspace) return;
        try {
            const response = await api.get('/api/v1/initiators/me');
            const initiator = response.data?.profile || null;
            if (initiator) {
                setInitiatorData({
                    companyName: initiator.companyName || '',
                    companyUrl: initiator.companyUrl || '',
                    companySize: initiator.companySize || '',
                    industry: initiator.industry || '',
                });
            }
        } catch {
            // keep existing local form state if fetch fails
        }
    }, [hasInitiatorWorkspace]);

    useEffect(() => {
        if (profile?.headline || profile?.bio || profile?.skills || profile?.availabilityHoursPerWeek !== undefined) {
            setContributorData((prev) => ({
                ...prev,
                headline: profile.headline || prev.headline,
                bio: profile.bio || prev.bio,
                githubUrl: profile.githubUrl || prev.githubUrl,
                linkedinUrl: profile.linkedinUrl || prev.linkedinUrl,
                portfolioUrl: profile.portfolioUrl || prev.portfolioUrl,
                timezone: profile.timezone || prev.timezone,
                availabilityHoursPerWeek: profile.availabilityHoursPerWeek ?? prev.availabilityHoursPerWeek,
            }));
        }
        if (profile?.companyName || profile?.industry || profile?.companySize || profile?.companyUrl) {
            setInitiatorData((prev) => ({
                ...prev,
                companyName: profile.companyName || prev.companyName,
                companyUrl: profile.companyUrl || prev.companyUrl,
                companySize: profile.companySize || prev.companySize,
                industry: profile.industry || prev.industry,
            }));
        }
    }, [profile]);

    const buildContributorPayload = () => {
        const availabilityHours = Number(contributorData.availabilityHoursPerWeek);
        return {
            headline: normalizeOptionalString(contributorData.headline),
            bio: normalizeOptionalString(contributorData.bio),
            githubUrl: normalizeOptionalUrl(contributorData.githubUrl),
            linkedinUrl: normalizeOptionalUrl(contributorData.linkedinUrl),
            portfolioUrl: normalizeOptionalUrl(contributorData.portfolioUrl),
            timezone: normalizeOptionalString(contributorData.timezone),
            availabilityHoursPerWeek: Number.isFinite(availabilityHours)
                ? Math.max(0, Math.min(80, availabilityHours))
                : 20,
        };
    };

    const buildInitiatorPayload = () => ({
        companyName: normalizeOptionalString(initiatorData.companyName),
        companyUrl: normalizeOptionalUrl(initiatorData.companyUrl),
        companySize: initiatorData.companySize || undefined,
        industry: normalizeOptionalString(initiatorData.industry),
    });

    const resetPortfolioForm = () => {
        setEditingPortfolioId('');
        setPortfolioForm({
            title: '',
            summary: '',
            role: '',
            skillsCsv: '',
            outcome: '',
            projectUrl: '',
            externalLinksCsv: '',
            imageUrlsCsv: '',
            featured: false,
        });
    };

    const fetchPortfolio = useCallback(async () => {
        if (!hasContributorWorkspace) return;
        setPortfolioLoading(true);
        try {
            const response = await api.get('/api/v1/portfolio/me');
            setPortfolioItems(response.data?.items || []);
        } catch (error) {
            toast.error(error.message || 'Failed to load portfolio items');
        } finally {
            setPortfolioLoading(false);
        }
    }, [hasContributorWorkspace]);

    useEffect(() => {
        if (!user?.uid || isAdmin) return;
        Promise.all([
            loadContributorProfile(),
            loadInitiatorProfile(),
            fetchPortfolio(),
        ]);
    }, [user?.uid, isAdmin, loadContributorProfile, loadInitiatorProfile, fetchPortfolio]);

    const handleEditPortfolio = (item) => {
        setEditingPortfolioId(item.id);
        setPortfolioForm({
            title: item.title || '',
            summary: item.summary || '',
            role: item.role || '',
            skillsCsv: (item.skills || []).join(', '),
            outcome: item.outcome || '',
            projectUrl: item.projectUrl || '',
            externalLinksCsv: (item.externalLinks || []).join(', '),
            imageUrlsCsv: (item.imageUrls || []).join(', '),
            featured: Boolean(item.featured),
        });
    };

    const handleSavePortfolio = async (event) => {
        event.preventDefault();
        if (!portfolioForm.title.trim()) {
            toast.error('Portfolio title is required');
            return;
        }

        const payload = {
            title: portfolioForm.title.trim(),
            summary: portfolioForm.summary.trim(),
            role: normalizeOptionalString(portfolioForm.role),
            skills: parseCsv(portfolioForm.skillsCsv),
            outcome: normalizeOptionalString(portfolioForm.outcome),
            projectUrl: normalizeOptionalUrl(portfolioForm.projectUrl),
            externalLinks: parseCsv(portfolioForm.externalLinksCsv),
            imageUrls: parseCsv(portfolioForm.imageUrlsCsv),
            featured: Boolean(portfolioForm.featured),
        };

        setPortfolioSaving(true);
        try {
            if (editingPortfolioId) {
                await api.patch(`/api/v1/portfolio/me/items/${editingPortfolioId}`, payload);
                toast.success('Portfolio item updated');
            } else {
                await api.post('/api/v1/portfolio/me/items', payload);
                toast.success('Portfolio item added');
            }
            resetPortfolioForm();
            await fetchPortfolio();
        } catch (error) {
            toast.error(error.message || 'Failed to save portfolio item');
        } finally {
            setPortfolioSaving(false);
        }
    };

    const handleDeletePortfolio = async (itemId) => {
        const confirmed = window.confirm('Delete this portfolio item? This action cannot be undone.');
        if (!confirmed) return;

        setPortfolioSaving(true);
        try {
            await api.delete(`/api/v1/portfolio/me/items/${itemId}`);
            toast.success('Portfolio item deleted');
            if (editingPortfolioId === itemId) {
                resetPortfolioForm();
            }
            await fetchPortfolio();
        } catch (error) {
            toast.error(error.message || 'Failed to delete portfolio item');
        } finally {
            setPortfolioSaving(false);
        }
    };

    const handleReorderPortfolio = async (itemId, direction) => {
        const currentIndex = portfolioItems.findIndex((item) => item.id === itemId);
        if (currentIndex === -1) return;
        const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (swapIndex < 0 || swapIndex >= portfolioItems.length) return;

        const reordered = [...portfolioItems];
        [reordered[currentIndex], reordered[swapIndex]] = [reordered[swapIndex], reordered[currentIndex]];
        setPortfolioItems(reordered);
        try {
            await api.patch('/api/v1/portfolio/me/reorder', {
                itemIds: reordered.map((item) => item.id),
            });
        } catch (error) {
            toast.error(error.message || 'Failed to reorder portfolio items');
            await fetchPortfolio();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const trimmedName = commonData.fullName.trim();
            const trimmedAvatar = commonData.avatarUrl.trim();

            if (trimmedName && trimmedName.length < 2) {
                throw new Error('Full name must be at least 2 characters');
            }

            const userPayload = {};
            if (trimmedName) {
                userPayload.fullName = trimmedName;
            }
            if (trimmedAvatar) {
                userPayload.avatarUrl = trimmedAvatar;
            }

            if (Object.keys(userPayload).length > 0) {
                await api.patch('/api/v1/users/me', userPayload);
            }

            if (hasContributorWorkspace) {
                await api.patch('/api/v1/contributors/me', buildContributorPayload());
            }

            if (hasInitiatorWorkspace) {
                await api.patch('/api/v1/initiators/me', buildInitiatorPayload());
            }

            await refreshProfile();
            await Promise.all([
                loadContributorProfile(),
                loadInitiatorProfile(),
            ]);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (skillId) => {
        if (!hasContributorWorkspace) return;

        try {
            await api.post('/api/v1/contributors/me/skills', {
                skillId,
                proficiencyLevel: 'intermediate',
                yearsExperience: 1,
            });
            await Promise.all([refreshProfile(), loadContributorProfile()]);
            toast.success('Skill added!');
        } catch {
            toast.error('Failed to add skill');
        }
    };

    const handleRemoveSkill = async (skillId) => {
        if (!hasContributorWorkspace) return;

        try {
            await api.delete(`/api/v1/contributors/me/skills/${skillId}`);
            await Promise.all([refreshProfile(), loadContributorProfile()]);
            toast.success('Skill removed');
        } catch {
            toast.error('Failed to remove skill');
        }
    };

    const userSkillIds = (contributorProfile?.skills || []).map((s) => s.skillId);
    const availableToAdd = (availableSkills || []).filter((s) => !userSkillIds.includes(s.id));

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto py-8 px-4">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="" className="h-16 w-16 rounded-full object-cover" />
                        ) : (
                            <User className="h-8 w-8 text-zinc-500" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{user?.displayName || 'Your Profile'}</h1>
                        <p className="text-zinc-500">{user?.email}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="border border-white/10 rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-semibold mb-4">Account</h2>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={commonData.fullName}
                                onChange={(e) => setCommonData((prev) => ({ ...prev, fullName: e.target.value }))}
                                placeholder="John Doe"
                                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Avatar URL (optional)</label>
                            <input
                                type="url"
                                value={commonData.avatarUrl}
                                onChange={(e) => setCommonData((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                                placeholder="https://example.com/avatar.png"
                                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                            />
                        </div>
                    </div>

                    {hasContributorWorkspace && (
                        <>
                            <div className="border border-white/10 rounded-lg p-6 space-y-4">
                                <h2 className="text-lg font-semibold mb-4">Professional Info</h2>

                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Headline</label>
                                    <input
                                        type="text"
                                        value={contributorData.headline}
                                        onChange={(e) => setContributorData((prev) => ({ ...prev, headline: e.target.value }))}
                                        placeholder="Full-Stack Developer | React & Node.js"
                                        maxLength={255}
                                        className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Bio</label>
                                    <textarea
                                        value={contributorData.bio}
                                        onChange={(e) => setContributorData((prev) => ({ ...prev, bio: e.target.value }))}
                                        placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                                        rows={4}
                                        maxLength={2000}
                                        className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                                    />
                                    <p className="text-xs text-zinc-600 mt-1">{contributorData.bio.length}/2000</p>
                                </div>
                            </div>

                            <div className="border border-white/10 rounded-lg p-6 space-y-4">
                                <h2 className="text-lg font-semibold mb-4">Links</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                                            <Github className="h-4 w-4" /> GitHub
                                        </label>
                                        <input
                                            type="url"
                                            value={contributorData.githubUrl}
                                            onChange={(e) => setContributorData((prev) => ({ ...prev, githubUrl: e.target.value }))}
                                            placeholder="https://github.com/username"
                                            className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                                            <Linkedin className="h-4 w-4" /> LinkedIn
                                        </label>
                                        <input
                                            type="url"
                                            value={contributorData.linkedinUrl}
                                            onChange={(e) => setContributorData((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
                                            placeholder="https://linkedin.com/in/username"
                                            className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                                            <Globe className="h-4 w-4" /> Portfolio
                                        </label>
                                        <input
                                            type="url"
                                            value={contributorData.portfolioUrl}
                                            onChange={(e) => setContributorData((prev) => ({ ...prev, portfolioUrl: e.target.value }))}
                                            placeholder="https://yourportfolio.com"
                                            className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border border-white/10 rounded-lg p-6 space-y-4">
                                <h2 className="text-lg font-semibold mb-4">Availability</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                                            <Clock className="h-4 w-4" /> Hours per week
                                        </label>
                                        <input
                                            type="number"
                                            value={contributorData.availabilityHoursPerWeek}
                                            onChange={(e) => setContributorData((prev) => ({ ...prev, availabilityHoursPerWeek: e.target.value }))}
                                            min={0}
                                            max={80}
                                            className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Timezone</label>
                                        <input
                                            type="text"
                                            value={contributorData.timezone}
                                            onChange={(e) => setContributorData((prev) => ({ ...prev, timezone: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {hasInitiatorWorkspace && (
                        <div className="border border-white/10 rounded-lg p-6 space-y-4">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Building2 className="h-4 w-4" /> Organization
                            </h2>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    value={initiatorData.companyName}
                                    onChange={(e) => setInitiatorData((prev) => ({ ...prev, companyName: e.target.value }))}
                                    placeholder="Acme Labs"
                                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Company URL</label>
                                <input
                                    type="url"
                                    value={initiatorData.companyUrl}
                                    onChange={(e) => setInitiatorData((prev) => ({ ...prev, companyUrl: e.target.value }))}
                                    placeholder="https://acme.com"
                                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Company Size</label>
                                    <select
                                        value={initiatorData.companySize}
                                        onChange={(e) => setInitiatorData((prev) => ({ ...prev, companySize: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                                    >
                                        <option value="">Select size</option>
                                        <option value="1-10">1-10</option>
                                        <option value="11-50">11-50</option>
                                        <option value="51-200">51-200</option>
                                        <option value="201-500">201-500</option>
                                        <option value="500+">500+</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Industry</label>
                                    <input
                                        type="text"
                                        value={initiatorData.industry}
                                        onChange={(e) => setInitiatorData((prev) => ({ ...prev, industry: e.target.value }))}
                                        placeholder="SaaS"
                                        className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <Button type="submit" className="w-full" isLoading={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                    </Button>
                </form>

                {hasContributorWorkspace && (
                    <div className="border border-white/10 rounded-lg p-6 mt-6">
                        <h2 className="text-lg font-semibold mb-4">Skills</h2>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {(contributorProfile?.skills || []).length === 0 ? (
                                <p className="text-zinc-500 text-sm">No skills added yet</p>
                            ) : (
                                (contributorProfile?.skills || []).map((skill) => (
                                    <span
                                        key={skill.skillId}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-800 rounded-full text-sm"
                                    >
                                        {skill.skillName}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(skill.skillId)}
                                            className="ml-1 hover:text-red-400"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>

                        <div>
                            <p className="text-sm text-zinc-500 mb-2">Add skills:</p>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                {skillsLoading ? (
                                    <span className="text-zinc-500 text-sm">Loading skills...</span>
                                ) : (
                                    availableToAdd.slice(0, 20).map((skill) => (
                                        <button
                                            key={skill.id}
                                            type="button"
                                            onClick={() => handleAddSkill(skill.id)}
                                            className="px-3 py-1.5 border border-white/10 rounded-full text-sm hover:bg-white/5 transition-colors"
                                        >
                                            + {skill.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {hasContributorWorkspace && (
                    <div className="border border-white/10 rounded-lg p-6 mt-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <BriefcaseBusiness className="h-4 w-4" />
                                Past Work Portfolio
                            </h2>
                            <button
                                type="button"
                                onClick={fetchPortfolio}
                                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5"
                            >
                                Refresh
                            </button>
                        </div>

                        <form onSubmit={handleSavePortfolio} className="grid md:grid-cols-2 gap-4 border border-white/10 rounded-lg p-4 bg-black/40">
                            <div className="md:col-span-2">
                                <label className="block text-sm text-zinc-400 mb-1">Project Title</label>
                                <input
                                    type="text"
                                    value={portfolioForm.title}
                                    onChange={(event) => setPortfolioForm((prev) => ({ ...prev, title: event.target.value }))}
                                    placeholder="Realtime Chat Moderation Console"
                                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm text-zinc-400 mb-1">Summary</label>
                                <textarea
                                    rows={3}
                                    value={portfolioForm.summary}
                                    onChange={(event) => setPortfolioForm((prev) => ({ ...prev, summary: event.target.value }))}
                                    placeholder="What you built, your contribution, and outcome."
                                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Your Role</label>
                                <input
                                    type="text"
                                    value={portfolioForm.role}
                                    onChange={(event) => setPortfolioForm((prev) => ({ ...prev, role: event.target.value }))}
                                    placeholder="Lead Fullstack Engineer"
                                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Project URL</label>
                                <input
                                    type="url"
                                    value={portfolioForm.projectUrl}
                                    onChange={(event) => setPortfolioForm((prev) => ({ ...prev, projectUrl: event.target.value }))}
                                    placeholder="https://project-site.com"
                                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Skills (comma separated)</label>
                                <input
                                    type="text"
                                    value={portfolioForm.skillsCsv}
                                    onChange={(event) => setPortfolioForm((prev) => ({ ...prev, skillsCsv: event.target.value }))}
                                    placeholder="React, Firebase, Tailwind"
                                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">External Links (comma separated)</label>
                                <input
                                    type="text"
                                    value={portfolioForm.externalLinksCsv}
                                    onChange={(event) => setPortfolioForm((prev) => ({ ...prev, externalLinksCsv: event.target.value }))}
                                    placeholder="https://behance.net/..., https://github.com/..."
                                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm text-zinc-400 mb-1">Image URLs (comma separated)</label>
                                <input
                                    type="text"
                                    value={portfolioForm.imageUrlsCsv}
                                    onChange={(event) => setPortfolioForm((prev) => ({ ...prev, imageUrlsCsv: event.target.value }))}
                                    placeholder="https://cdn.site.com/shot1.png, https://cdn.site.com/shot2.png"
                                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm text-zinc-400 mb-1">Outcome</label>
                                <textarea
                                    rows={2}
                                    value={portfolioForm.outcome}
                                    onChange={(event) => setPortfolioForm((prev) => ({ ...prev, outcome: event.target.value }))}
                                    placeholder="Improved conversion by 17%, reduced latency by 40%, etc."
                                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 resize-none"
                                />
                            </div>

                            <div className="md:col-span-2 flex items-center justify-between gap-3">
                                <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
                                    <input
                                        type="checkbox"
                                        checked={portfolioForm.featured}
                                        onChange={(event) => setPortfolioForm((prev) => ({ ...prev, featured: event.target.checked }))}
                                    />
                                    Featured project
                                </label>
                                <div className="flex items-center gap-2">
                                    {editingPortfolioId && (
                                        <button
                                            type="button"
                                            onClick={resetPortfolioForm}
                                            className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={portfolioSaving}
                                        className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold disabled:opacity-60"
                                    >
                                        {editingPortfolioId ? 'Update Project' : 'Add Project'}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {portfolioLoading ? (
                            <p className="text-zinc-500 text-sm">Loading portfolio...</p>
                        ) : portfolioItems.length === 0 ? (
                            <p className="text-zinc-500 text-sm">No past work added yet.</p>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {portfolioItems.map((item, index) => (
                                    <div key={item.id} className="border border-white/10 rounded-lg p-4 bg-black/40">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-semibold text-white flex items-center gap-2">
                                                    {item.title}
                                                    {item.featured && <Star className="h-3.5 w-3.5 text-yellow-400" />}
                                                </h3>
                                                {item.role && <p className="text-xs text-zinc-500 mt-1">{item.role}</p>}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleReorderPortfolio(item.id, 'up')}
                                                    disabled={index === 0}
                                                    className="p-1.5 rounded hover:bg-white/5 disabled:opacity-40"
                                                    title="Move up"
                                                >
                                                    <MoveUp className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleReorderPortfolio(item.id, 'down')}
                                                    disabled={index === portfolioItems.length - 1}
                                                    className="p-1.5 rounded hover:bg-white/5 disabled:opacity-40"
                                                    title="Move down"
                                                >
                                                    <MoveDown className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeletePortfolio(item.id)}
                                                    className="p-1.5 rounded hover:bg-red-500/10 text-red-300"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-zinc-400 mt-3 line-clamp-3">{item.summary}</p>
                                        {(item.skills || []).length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {item.skills.slice(0, 5).map((skill) => (
                                                    <span key={`${item.id}-${skill}`} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-zinc-300">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between gap-2 mt-4">
                                            <button
                                                type="button"
                                                onClick={() => handleEditPortfolio(item)}
                                                className="text-xs px-3 py-1.5 border border-white/10 rounded hover:bg-white/5"
                                            >
                                                Edit
                                            </button>
                                            <span className="text-[11px] text-zinc-600">{(item.imageUrls || []).length} image link(s)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ProfileSettings;
