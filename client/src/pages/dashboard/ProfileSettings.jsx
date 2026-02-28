import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSkills } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { User, Github, Linkedin, Globe, Clock, Save, X, Building2 } from 'lucide-react';

const normalizeOptionalUrl = (value) => {
    const trimmed = (value || '').trim();
    return trimmed ? trimmed : null;
};

const normalizeOptionalString = (value) => {
    const trimmed = (value || '').trim();
    return trimmed ? trimmed : undefined;
};

const ProfileSettings = () => {
    const { user, profile, role, refreshProfile } = useAuthStore();
    const isContributor = role === 'contributor';
    const isInitiator = role === 'initiator';

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

    useEffect(() => {
        setCommonData({
            fullName: user?.displayName || '',
            avatarUrl: user?.photoURL || '',
        });
    }, [user]);

    useEffect(() => {
        if (!profile) return;

        setContributorData({
            headline: profile.headline || '',
            bio: profile.bio || '',
            githubUrl: profile.githubUrl || '',
            linkedinUrl: profile.linkedinUrl || '',
            portfolioUrl: profile.portfolioUrl || '',
            timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            availabilityHoursPerWeek: profile.availabilityHoursPerWeek ?? 20,
        });

        setInitiatorData({
            companyName: profile.companyName || '',
            companyUrl: profile.companyUrl || '',
            companySize: profile.companySize || '',
            industry: profile.industry || '',
        });
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

            if (isContributor) {
                await api.patch('/api/v1/contributors/me', buildContributorPayload());
            }

            if (isInitiator) {
                await api.patch('/api/v1/initiators/me', buildInitiatorPayload());
            }

            await refreshProfile();
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (skillId) => {
        if (!isContributor) return;

        try {
            await api.post('/api/v1/contributors/me/skills', {
                skillId,
                proficiencyLevel: 'intermediate',
                yearsExperience: 1,
            });
            await refreshProfile();
            toast.success('Skill added!');
        } catch {
            toast.error('Failed to add skill');
        }
    };

    const handleRemoveSkill = async (skillId) => {
        if (!isContributor) return;

        try {
            await api.delete(`/api/v1/contributors/me/skills/${skillId}`);
            await refreshProfile();
            toast.success('Skill removed');
        } catch {
            toast.error('Failed to remove skill');
        }
    };

    const userSkillIds = (profile?.skills || []).map((s) => s.skillId);
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

                    {isContributor && (
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

                    {isInitiator && (
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

                {isContributor && (
                    <div className="border border-white/10 rounded-lg p-6 mt-6">
                        <h2 className="text-lg font-semibold mb-4">Skills</h2>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {(profile?.skills || []).length === 0 ? (
                                <p className="text-zinc-500 text-sm">No skills added yet</p>
                            ) : (
                                profile.skills.map((skill) => (
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
            </div>
        </DashboardLayout>
    );
};

export default ProfileSettings;
