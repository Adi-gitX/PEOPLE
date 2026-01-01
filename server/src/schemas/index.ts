import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════
// SHARED VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════

// ─── Common ───
export const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

// ─── User Schemas ───
export const userRoleSchema = z.enum(['contributor', 'initiator', 'admin']);

export const createUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    role: userRoleSchema,
});

export const updateUserSchema = z.object({
    fullName: z.string().min(2).optional(),
    avatarUrl: z.string().url().optional(),
}).partial();

// ─── Contributor Profile Schemas ───
export const contributorVerificationStatus = z.enum([
    'pending',
    'proof_task_submitted',
    'verified',
    'rejected',
]);

export const updateContributorProfileSchema = z.object({
    headline: z.string().max(255).optional(),
    bio: z.string().max(2000).optional(),
    githubUrl: z.string().url().optional().nullable(),
    linkedinUrl: z.string().url().optional().nullable(),
    portfolioUrl: z.string().url().optional().nullable(),
    timezone: z.string().optional(),
    availabilityHoursPerWeek: z.number().min(0).max(80).optional(),
}).partial();

export const updateAvailabilitySchema = z.object({
    isLookingForWork: z.boolean(),
});

export const addSkillSchema = z.object({
    skillId: z.string().min(1),
    proficiencyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate'),
    yearsExperience: z.number().min(0).max(50).default(1),
});

// ─── Initiator Profile Schemas ───
export const updateInitiatorProfileSchema = z.object({
    companyName: z.string().max(255).optional(),
    companyUrl: z.string().url().optional().nullable(),
    companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
    industry: z.string().max(100).optional(),
}).partial();

// ─── Mission Schemas ───
export const missionTypeSchema = z.enum([
    'algorithm',
    'frontend',
    'backend',
    'fullstack',
    'mobile',
    'devops',
    'design',
    'qa',
    'security',
    'data',
    'other',
]);

export const missionComplexitySchema = z.enum(['easy', 'medium', 'hard', 'expert']);

export const missionStatusSchema = z.enum([
    'draft',
    'pending_funding',
    'open',
    'matching',
    'in_progress',
    'in_review',
    'completed',
    'cancelled',
    'disputed',
]);

export const createMissionSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(255),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    problemStatement: z.string().optional(),
    successCriteria: z.string().optional(),
    type: missionTypeSchema,
    complexity: missionComplexitySchema.default('medium'),
    budgetMin: z.number().min(100, 'Minimum budget is $100'),
    budgetMax: z.number().min(100),
    estimatedDurationDays: z.number().min(1).max(365),
    deadline: z.string().datetime().optional(),
    requiredSkills: z.array(z.string()).default([]),
    isPublic: z.boolean().default(true),
}).refine((data) => data.budgetMax >= data.budgetMin, {
    message: 'Maximum budget must be greater than or equal to minimum budget',
    path: ['budgetMax'],
});

export const updateMissionSchema = z.object({
    title: z.string().min(5).max(255).optional(),
    description: z.string().min(20).optional(),
    problemStatement: z.string().optional(),
    successCriteria: z.string().optional(),
    type: missionTypeSchema.optional(),
    complexity: missionComplexitySchema.optional(),
    budgetMin: z.number().min(100).optional(),
    budgetMax: z.number().min(100).optional(),
    estimatedDurationDays: z.number().min(1).max(365).optional(),
    deadline: z.string().datetime().optional(),
    requiredSkills: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
});

// ─── Milestone Schemas ───
export const milestoneStatusSchema = z.enum([
    'pending',
    'in_progress',
    'submitted',
    'approved',
    'revision',
    'paid',
]);

export const createMilestoneSchema = z.object({
    title: z.string().min(3).max(255),
    description: z.string().optional(),
    amount: z.number().min(50, 'Minimum milestone amount is $50'),
    dueDate: z.string().datetime().optional(),
});

// ─── Application Schemas ───
export const applicationStatusSchema = z.enum([
    'pending',
    'shortlisted',
    'accepted',
    'rejected',
    'withdrawn',
]);

export const createApplicationSchema = z.object({
    coverLetter: z.string().max(2000).optional(),
    proposedTimeline: z.number().min(1).optional(),
    proposedApproach: z.string().max(5000).optional(),
});

// ─── Notification Schemas ───
export const notificationPrioritySchema = z.enum(['basic', 'medium', 'urgent', 'final']);

// ─── Type Exports ───
export type UserRole = z.infer<typeof userRoleSchema>;
export type ContributorVerificationStatus = z.infer<typeof contributorVerificationStatus>;
export type MissionType = z.infer<typeof missionTypeSchema>;
export type MissionComplexity = z.infer<typeof missionComplexitySchema>;
export type MissionStatus = z.infer<typeof missionStatusSchema>;
export type MilestoneStatus = z.infer<typeof milestoneStatusSchema>;
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;

export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateContributorProfile = z.infer<typeof updateContributorProfileSchema>;
export type UpdateInitiatorProfile = z.infer<typeof updateInitiatorProfileSchema>;
export type CreateMission = z.infer<typeof createMissionSchema>;
export type UpdateMission = z.infer<typeof updateMissionSchema>;
export type CreateMilestone = z.infer<typeof createMilestoneSchema>;
export type CreateApplication = z.infer<typeof createApplicationSchema>;
