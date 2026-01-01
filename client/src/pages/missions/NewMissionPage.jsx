import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { useSkills } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { X, Plus, Rocket } from 'lucide-react';

export default function NewMissionPage() {
    const navigate = useNavigate();
    const { skills: availableSkills, loading: skillsLoading } = useSkills();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        problemStatement: '',
        successCriteria: '',
        type: 'backend',
        complexity: 'medium',
        budgetMin: 500,
        budgetMax: 2000,
        estimatedDurationDays: 14,
        requiredSkills: [],
        isPublic: true,
    });

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) : value
        }));
    };

    const handleAddSkill = (skillId) => {
        if (!formData.requiredSkills.includes(skillId)) {
            setFormData(prev => ({
                ...prev,
                requiredSkills: [...prev.requiredSkills, skillId]
            }));
        }
    };

    const handleRemoveSkill = (skillId) => {
        setFormData(prev => ({
            ...prev,
            requiredSkills: prev.requiredSkills.filter(id => id !== skillId)
        }));
    };

    const handleSubmit = async (e, asDraft = false) => {
        e.preventDefault();

        if (!formData.title || formData.title.length < 5) {
            toast.error('Title must be at least 5 characters');
            return;
        }

        if (!formData.description || formData.description.length < 20) {
            toast.error('Description must be at least 20 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/api/v1/missions', {
                ...formData,
                description: formData.description || formData.problemStatement,
            });

            toast.success(asDraft ? 'Mission saved as draft!' : 'Mission created!');
            navigate(`/missions/${response.data.mission.id}`);
        } catch (error) {
            console.error('Create mission error:', error);
            toast.error(error.message || 'Failed to create mission');
        } finally {
            setLoading(false);
        }
    };

    const selectedSkillNames = (availableSkills || [])
        .filter(s => formData.requiredSkills.includes(s.id))
        .map(s => ({ id: s.id, name: s.name }));

    const availableToAdd = (availableSkills || [])
        .filter(s => !formData.requiredSkills.includes(s.id))
        .slice(0, 15);

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                        <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter">Initialize a Mission</h1>
                        <p className="text-muted-foreground">Describe the problem you need solved. We'll assemble the team.</p>
                    </div>
                </div>

                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
                    <div className="space-y-6">

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mission Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Build a React-based Analytics Dashboard"
                                minLength={5}
                                maxLength={255}
                                required
                                className="flex h-12 w-full rounded-lg border border-white/10 bg-black px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                            />
                        </div>


                        <div className="space-y-2">
                            <label className="text-sm font-medium">Problem Statement *</label>
                            <textarea
                                name="problemStatement"
                                value={formData.problemStatement}
                                onChange={(e) => {
                                    handleChange(e);
                                    setFormData(prev => ({ ...prev, description: e.target.value }));
                                }}
                                placeholder="Describe the core problem and desired outcome..."
                                required
                                minLength={20}
                                className="flex min-h-[150px] w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                            />
                        </div>


                        <div className="space-y-2">
                            <label className="text-sm font-medium">Success Criteria</label>
                            <textarea
                                name="successCriteria"
                                value={formData.successCriteria}
                                onChange={handleChange}
                                placeholder="How will we know this mission is successful?"
                                className="flex min-h-[100px] w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                            />
                        </div>


                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mission Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="flex h-12 w-full rounded-lg border border-white/10 bg-black px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                                >
                                    <option value="frontend">Frontend</option>
                                    <option value="backend">Backend</option>
                                    <option value="fullstack">Full Stack</option>
                                    <option value="mobile">Mobile</option>
                                    <option value="design">Design</option>
                                    <option value="devops">DevOps</option>
                                    <option value="data">Data/ML</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Complexity</label>
                                <select
                                    name="complexity"
                                    value={formData.complexity}
                                    onChange={handleChange}
                                    className="flex h-12 w-full rounded-lg border border-white/10 bg-black px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>
                        </div>


                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Budget Min ($)</label>
                                <input
                                    type="number"
                                    name="budgetMin"
                                    value={formData.budgetMin}
                                    onChange={handleChange}
                                    min={100}
                                    className="flex h-12 w-full rounded-lg border border-white/10 bg-black px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Budget Max ($)</label>
                                <input
                                    type="number"
                                    name="budgetMax"
                                    value={formData.budgetMax}
                                    onChange={handleChange}
                                    min={formData.budgetMin}
                                    className="flex h-12 w-full rounded-lg border border-white/10 bg-black px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                                />
                            </div>
                        </div>


                        <div className="space-y-2">
                            <label className="text-sm font-medium">Estimated Duration (days)</label>
                            <input
                                type="number"
                                name="estimatedDurationDays"
                                value={formData.estimatedDurationDays}
                                onChange={handleChange}
                                min={1}
                                max={365}
                                className="flex h-12 w-full rounded-lg border border-white/10 bg-black px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                            />
                        </div>


                        <div className="space-y-3">
                            <label className="text-sm font-medium">Required Skills</label>


                            <div className="flex flex-wrap gap-2">
                                {selectedSkillNames.map((skill) => (
                                    <span
                                        key={skill.id}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-sm border border-blue-500/20"
                                    >
                                        {skill.name}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(skill.id)}
                                            className="ml-1 hover:text-red-400"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>


                            <div className="flex flex-wrap gap-2">
                                {skillsLoading ? (
                                    <span className="text-zinc-500 text-sm">Loading skills...</span>
                                ) : (
                                    availableToAdd.map((skill) => (
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

                    <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={loading}
                        >
                            Save Draft
                        </Button>
                        <Button type="submit" isLoading={loading}>
                            <Rocket className="w-4 h-4 mr-2" />
                            Initialize Mission
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
