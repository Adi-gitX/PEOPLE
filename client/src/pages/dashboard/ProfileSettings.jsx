import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSkills } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { User, Link, Github, Linkedin, Globe, Clock, Save, X } from 'lucide-react';

const ProfileSettings = () => {
    const { user, profile, refreshProfile } = useAuthStore();
    const { skills: availableSkills, loading: skillsLoading } = useSkills();

    const [formData, setFormData] = useState({
        headline: '',
        bio: '',
        githubUrl: '',
        linkedinUrl: '',
        portfolioUrl: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        availabilityHoursPerWeek: 20,
    });
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (profile) {
            setFormData({
                headline: profile.headline || '',
                bio: profile.bio || '',
                githubUrl: profile.githubUrl || '',
                linkedinUrl: profile.linkedinUrl || '',
                portfolioUrl: profile.portfolioUrl || '',
                timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                availabilityHoursPerWeek: profile.availabilityHoursPerWeek || 20,
            });
        }
    }, [profile]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch('/api/v1/contributors/me', formData);
            await refreshProfile();
            toast.success('Profile updated!');
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (skillId) => {
        try {
            await api.post('/api/v1/contributors/me/skills', {
                skillId,
                proficiencyLevel: 'intermediate',
                yearsExperience: 1,
            });
            await refreshProfile();
            toast.success('Skill added!');
        } catch (error) {
            toast.error('Failed to add skill');
        }
    };

    const handleRemoveSkill = async (skillId) => {
        try {
            await api.delete(`/api/v1/contributors/me/skills/${skillId}`);
            await refreshProfile();
            toast.success('Skill removed');
        } catch (error) {
            toast.error('Failed to remove skill');
        }
    };


    const userSkillIds = (profile?.skills || []).map(s => s.skillId);
    const availableToAdd = (availableSkills || []).filter(s => !userSkillIds.includes(s.id));

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto py-8 px-4">

                <div className="flex items-center gap-4 mb-8">
                    <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="" className="h-16 w-16 rounded-full" />
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
                        <h2 className="text-lg font-semibold mb-4">Professional Info</h2>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Headline</label>
                            <input
                                type="text"
                                name="headline"
                                value={formData.headline}
                                onChange={handleChange}
                                placeholder="Full-Stack Developer | React & Node.js"
                                maxLength={255}
                                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Bio</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                                rows={4}
                                maxLength={2000}
                                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                            />
                            <p className="text-xs text-zinc-600 mt-1">{formData.bio.length}/2000</p>
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
                                    name="githubUrl"
                                    value={formData.githubUrl}
                                    onChange={handleChange}
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
                                    name="linkedinUrl"
                                    value={formData.linkedinUrl}
                                    onChange={handleChange}
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
                                    name="portfolioUrl"
                                    value={formData.portfolioUrl}
                                    onChange={handleChange}
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
                                    name="availabilityHoursPerWeek"
                                    value={formData.availabilityHoursPerWeek}
                                    onChange={handleChange}
                                    min={0}
                                    max={80}
                                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Timezone</label>
                                <input
                                    type="text"
                                    name="timezone"
                                    value={formData.timezone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" isLoading={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                    </Button>
                </form>


                <div className="border border-white/10 rounded-lg p-6 mt-6">
                    <h2 className="text-lg font-semibold mb-4">Skills</h2>


                    <div className="flex flex-wrap gap-2 mb-4">
                        {(profile?.skills || []).length === 0 ? (
                            <p className="text-zinc-500 text-sm">No skills added yet</p>
                        ) : (
                            profile?.skills.map((skill) => (
                                <span
                                    key={skill.skillId}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-800 rounded-full text-sm"
                                >
                                    {skill.skillName}
                                    <button
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
            </div>
        </DashboardLayout>
    );
};

export default ProfileSettings;
