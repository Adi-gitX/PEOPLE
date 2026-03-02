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
export const publicUserRoleSchema = z.enum(['contributor', 'initiator']);

export const createUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    role: publicUserRoleSchema,
});

export const updateUserSchema = z.object({
    fullName: z.string().min(2).optional(),
    avatarUrl: z.string().url().optional(),
}).partial();

export const updateActiveRoleSchema = z.object({
    role: publicUserRoleSchema,
});

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

// ─── Support Schemas ───
export const supportTicketCategorySchema = z.enum([
    'general',
    'technical',
    'billing',
    'account',
    'safety',
    'other',
]);

export const supportTicketPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
export const supportTicketStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed']);

export const createSupportTicketSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    subject: z.string().min(1).max(200),
    message: z.string().min(10).max(5000),
    category: supportTicketCategorySchema.optional(),
    priority: supportTicketPrioritySchema.optional(),
    source: z.string().max(100).optional(),
    website: z.string().max(200).optional(),
});

export const supportTicketsQuerySchema = z.object({
    status: supportTicketStatusSchema.optional(),
    priority: supportTicketPrioritySchema.optional(),
    category: supportTicketCategorySchema.optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
    cursor: z.string().optional(),
});

export const updateSupportTicketSchema = z.object({
    status: supportTicketStatusSchema.optional(),
    priority: supportTicketPrioritySchema.optional(),
}).refine((value) => value.status || value.priority, {
    message: 'At least one field is required',
});

export const supportReplySchema = z.object({
    message: z.string().min(1).max(5000),
});

export const processSupportOutboxSchema = z.object({
    limit: z.number().int().min(1).max(50).optional(),
}).default({});

// ─── Admin Console Schemas ───
export const adminMessagesConversationQuerySchema = z.object({
    q: z.string().max(200).optional(),
    status: z.enum(['normal', 'locked']).optional(),
    missionId: z.string().min(1).optional(),
    participantId: z.string().min(1).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
});

export const adminMessagesQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).optional(),
    before: z.string().optional(),
});

export const adminConversationModerationSchema = z.object({
    action: z.enum(['lock', 'unlock']),
    reason: z.string().min(3).max(500),
});

export const adminMessageModerationSchema = z.object({
    action: z.enum(['hide', 'restore']),
    reason: z.string().min(3).max(500),
});

export const adminWithdrawalsQuerySchema = z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
});

export const adminPaymentsIntentQuerySchema = z.object({
    provider: z.enum(['stripe', 'razorpay']).optional(),
    status: z.enum(['pending', 'requires_action', 'succeeded', 'failed', 'cancelled']).optional(),
    missionId: z.string().min(1).optional(),
    initiatorId: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
});

export const adminEscrowAccountsQuerySchema = z.object({
    status: z.enum(['pending_funding', 'funded', 'partially_released', 'completed', 'disputed', 'refunded']).optional(),
    missionId: z.string().min(1).optional(),
    initiatorId: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
});

export const adminAuditLogsQuerySchema = z.object({
    actorId: z.string().min(1).optional(),
    scope: z.string().min(1).max(100).optional(),
    action: z.string().min(1).max(100).optional(),
    resourceType: z.string().min(1).max(100).optional(),
    resourceId: z.string().min(1).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
});

export const adminTypeSchema = z.enum(['super_admin', 'support_admin', 'ops_admin', 'trust_safety']);

export const adminScopeSchema = z.enum([
    'support.read',
    'support.write',
    'support.reply',
    'users.read',
    'users.write',
    'missions.read',
    'missions.write',
    'disputes.read',
    'disputes.resolve',
    'messages.read',
    'messages.moderate',
    'withdrawals.read',
    'withdrawals.write',
    'payments.read',
    'escrow.read',
    'audit.read',
    'admins.manage',
]);

export const adminUsersQuerySchema = z.object({
    q: z.string().max(200).optional(),
    adminType: adminTypeSchema.optional(),
    isActive: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
});

export const createAdminUserSchema = z.object({
    uid: z.string().min(1).optional(),
    email: z.string().email().optional(),
    adminType: adminTypeSchema,
    scopes: z.array(adminScopeSchema).optional(),
    isActive: z.boolean().optional(),
    mfaRequired: z.boolean().optional(),
}).refine((data) => Boolean(data.uid || data.email), {
    message: 'Either uid or email is required',
    path: ['uid'],
});

export const updateAdminUserSchema = z.object({
    adminType: adminTypeSchema.optional(),
    scopes: z.array(adminScopeSchema).optional(),
    isActive: z.boolean().optional(),
    mfaRequired: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one update field is required',
});

export const adminMfaResetSchema = z.object({
    reason: z.string().min(3).max(500).optional(),
});

export const adminVerifyUserSchema = z.object({
    role: z.enum(['contributor', 'initiator', 'both']).optional(),
});

// ─── Public Search Schemas ───
export const searchUsersQuerySchema = z.object({
    q: z.string().max(200).optional(),
    role: z.enum(['contributor', 'initiator']).optional(),
    skills: z.union([z.string(), z.array(z.string())]).optional(),
    location: z.string().max(100).optional(),
    availability: z.coerce.boolean().optional(),
    verified: z.coerce.boolean().optional(),
    minRate: z.coerce.number().min(0).optional(),
    maxRate: z.coerce.number().min(0).optional(),
    sort: z.enum(['relevance', 'trust', 'match_power', 'newest']).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
});

// ─── Type Exports ───
export type UserRole = z.infer<typeof userRoleSchema>;
export type PublicUserRole = z.infer<typeof publicUserRoleSchema>;
export type ContributorVerificationStatus = z.infer<typeof contributorVerificationStatus>;
export type MissionType = z.infer<typeof missionTypeSchema>;
export type MissionComplexity = z.infer<typeof missionComplexitySchema>;
export type MissionStatus = z.infer<typeof missionStatusSchema>;
export type MilestoneStatus = z.infer<typeof milestoneStatusSchema>;
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;
export type SupportTicketCategory = z.infer<typeof supportTicketCategorySchema>;
export type SupportTicketPriority = z.infer<typeof supportTicketPrioritySchema>;
export type SupportTicketStatus = z.infer<typeof supportTicketStatusSchema>;
export type AdminMessagesConversationQuery = z.infer<typeof adminMessagesConversationQuerySchema>;
export type AdminMessagesQuery = z.infer<typeof adminMessagesQuerySchema>;
export type AdminConversationModeration = z.infer<typeof adminConversationModerationSchema>;
export type AdminMessageModeration = z.infer<typeof adminMessageModerationSchema>;
export type AdminWithdrawalsQuery = z.infer<typeof adminWithdrawalsQuerySchema>;
export type AdminPaymentsIntentQuery = z.infer<typeof adminPaymentsIntentQuerySchema>;
export type AdminEscrowAccountsQuery = z.infer<typeof adminEscrowAccountsQuerySchema>;
export type AdminAuditLogsQuery = z.infer<typeof adminAuditLogsQuerySchema>;
export type AdminType = z.infer<typeof adminTypeSchema>;
export type AdminScope = z.infer<typeof adminScopeSchema>;
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
export type CreateAdminUser = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUser = z.infer<typeof updateAdminUserSchema>;
export type AdminMfaReset = z.infer<typeof adminMfaResetSchema>;
export type AdminVerifyUser = z.infer<typeof adminVerifyUserSchema>;
export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;

export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateActiveRole = z.infer<typeof updateActiveRoleSchema>;
export type UpdateContributorProfile = z.infer<typeof updateContributorProfileSchema>;
export type UpdateInitiatorProfile = z.infer<typeof updateInitiatorProfileSchema>;
export type CreateMission = z.infer<typeof createMissionSchema>;
export type UpdateMission = z.infer<typeof updateMissionSchema>;
export type CreateMilestone = z.infer<typeof createMilestoneSchema>;
export type CreateApplication = z.infer<typeof createApplicationSchema>;
export type CreateSupportTicket = z.infer<typeof createSupportTicketSchema>;
