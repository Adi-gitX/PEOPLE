// Validation Schemas using Zod-like patterns
// Runtime type validation for API inputs

interface ValidationResult {
    valid: boolean;
    errors: string[];
    data?: any;
}

type Validator = (value: any) => ValidationResult;

// Basic validators
export const string = (options?: { min?: number; max?: number; pattern?: RegExp }): Validator => {
    return (value: any): ValidationResult => {
        const errors: string[] = [];

        if (typeof value !== 'string') {
            return { valid: false, errors: ['Must be a string'] };
        }

        if (options?.min && value.length < options.min) {
            errors.push(`Must be at least ${options.min} characters`);
        }

        if (options?.max && value.length > options.max) {
            errors.push(`Must be at most ${options.max} characters`);
        }

        if (options?.pattern && !options.pattern.test(value)) {
            errors.push('Invalid format');
        }

        return { valid: errors.length === 0, errors, data: value };
    };
};

export const number = (options?: { min?: number; max?: number; integer?: boolean }): Validator => {
    return (value: any): ValidationResult => {
        const errors: string[] = [];

        const num = typeof value === 'string' ? parseFloat(value) : value;

        if (typeof num !== 'number' || isNaN(num)) {
            return { valid: false, errors: ['Must be a number'] };
        }

        if (options?.integer && !Number.isInteger(num)) {
            errors.push('Must be an integer');
        }

        if (options?.min !== undefined && num < options.min) {
            errors.push(`Must be at least ${options.min}`);
        }

        if (options?.max !== undefined && num > options.max) {
            errors.push(`Must be at most ${options.max}`);
        }

        return { valid: errors.length === 0, errors, data: num };
    };
};

export const email = (): Validator => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (value: any): ValidationResult => {
        if (typeof value !== 'string' || !pattern.test(value)) {
            return { valid: false, errors: ['Invalid email address'] };
        }
        return { valid: true, errors: [], data: value.toLowerCase().trim() };
    };
};

export const url = (): Validator => {
    return (value: any): ValidationResult => {
        if (!value) return { valid: true, errors: [], data: value }; // Optional

        try {
            new URL(value);
            return { valid: true, errors: [], data: value };
        } catch {
            return { valid: false, errors: ['Invalid URL'] };
        }
    };
};

export const array = (itemValidator?: Validator, options?: { min?: number; max?: number }): Validator => {
    return (value: any): ValidationResult => {
        if (!Array.isArray(value)) {
            return { valid: false, errors: ['Must be an array'] };
        }

        const errors: string[] = [];

        if (options?.min && value.length < options.min) {
            errors.push(`Must have at least ${options.min} items`);
        }

        if (options?.max && value.length > options.max) {
            errors.push(`Must have at most ${options.max} items`);
        }

        if (itemValidator) {
            value.forEach((item, i) => {
                const result = itemValidator(item);
                if (!result.valid) {
                    errors.push(`Item ${i}: ${result.errors.join(', ')}`);
                }
            });
        }

        return { valid: errors.length === 0, errors, data: value };
    };
};

export const oneOf = (values: any[]): Validator => {
    return (value: any): ValidationResult => {
        if (!values.includes(value)) {
            return { valid: false, errors: [`Must be one of: ${values.join(', ')}`] };
        }
        return { valid: true, errors: [], data: value };
    };
};

export const optional = (validator: Validator): Validator => {
    return (value: any): ValidationResult => {
        if (value === undefined || value === null || value === '') {
            return { valid: true, errors: [], data: undefined };
        }
        return validator(value);
    };
};

// Schema validator
interface Schema {
    [key: string]: Validator;
}

export const validateSchema = (schema: Schema, data: Record<string, any>): ValidationResult => {
    const errors: string[] = [];
    const validatedData: Record<string, any> = {};

    for (const [key, validator] of Object.entries(schema)) {
        const result = validator(data[key]);
        if (!result.valid) {
            errors.push(`${key}: ${result.errors.join(', ')}`);
        } else {
            validatedData[key] = result.data;
        }
    }

    return { valid: errors.length === 0, errors, data: validatedData };
};

// Pre-built schemas for common operations
export const schemas = {
    createMission: {
        title: string({ min: 10, max: 200 }),
        description: string({ min: 50, max: 5000 }),
        budgetMin: number({ min: 10, max: 1000000 }),
        budgetMax: number({ min: 10, max: 1000000 }),
        estimatedDurationDays: number({ min: 1, max: 365, integer: true }),
        type: oneOf(['algorithm', 'frontend', 'backend', 'fullstack', 'mobile', 'devops', 'design', 'qa', 'security', 'data', 'other']),
        complexity: oneOf(['easy', 'medium', 'hard', 'expert']),
        requiredSkills: array(string(), { min: 1, max: 10 }),
    },

    createProposal: {
        missionId: string({ min: 1 }),
        bidAmount: number({ min: 10, max: 1000000 }),
        deliveryDays: number({ min: 1, max: 365, integer: true }),
        coverLetter: string({ min: 50, max: 2000 }),
    },

    createContract: {
        missionId: string({ min: 1 }),
        proposalId: string({ min: 1 }),
        contributorId: string({ min: 1 }),
        title: string({ min: 5, max: 200 }),
        totalAmount: number({ min: 10 }),
    },

    updateProfile: {
        headline: optional(string({ min: 10, max: 100 })),
        bio: optional(string({ min: 50, max: 2000 })),
        githubUrl: optional(url()),
        linkedinUrl: optional(url()),
        portfolioUrl: optional(url()),
        yearsExperience: optional(number({ min: 0, max: 50, integer: true })),
        timezone: optional(string({ max: 50 })),
        availabilityHoursPerWeek: optional(number({ min: 0, max: 80, integer: true })),
    },

    createReview: {
        rating: number({ min: 1, max: 5 }),
        comment: optional(string({ max: 1000 })),
    },

    createDispute: {
        missionId: string({ min: 1 }),
        reason: oneOf(['quality', 'timeline', 'communication', 'payment', 'other']),
        description: string({ min: 50, max: 2000 }),
    },

    withdrawal: {
        amount: number({ min: 10, max: 50000 }),
        payoutMethod: oneOf(['bank_transfer', 'paypal', 'crypto']),
    },
};

// Express middleware factory
export const validate = (schemaName: keyof typeof schemas) => {
    return (req: any, res: any, next: any): void => {
        const schema = schemas[schemaName];
        const result = validateSchema(schema, req.body);

        if (!result.valid) {
            res.status(400).json({
                error: 'Validation failed',
                details: result.errors,
            });
            return;
        }

        // Replace body with validated/cleaned data
        req.body = { ...req.body, ...result.data };
        next();
    };
};
