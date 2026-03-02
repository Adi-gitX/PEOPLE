import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { searchUsersQuerySchema } from '../../schemas/index.js';
import { searchUsers } from './search.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const router = Router();

const parseSkills = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .flatMap((entry) => `${entry}`.split(','))
            .map((entry) => entry.trim())
            .filter(Boolean);
    }
    if (typeof value === 'string') {
        return value.split(',').map((entry) => entry.trim()).filter(Boolean);
    }
    return [];
};

router.get('/users', optionalAuth, validate(searchUsersQuerySchema, 'query'), async (req, res) => {
    try {
        const result = await searchUsers({
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
            role: req.query.role as 'contributor' | 'initiator' | undefined,
            skills: parseSkills(req.query.skills),
            location: typeof req.query.location === 'string' ? req.query.location : undefined,
            availability: typeof req.query.availability === 'boolean' ? req.query.availability : undefined,
            verified: typeof req.query.verified === 'boolean' ? req.query.verified : undefined,
            minRate: typeof req.query.minRate === 'number' ? req.query.minRate : undefined,
            maxRate: typeof req.query.maxRate === 'number' ? req.query.maxRate : undefined,
            sort: req.query.sort as 'relevance' | 'trust' | 'match_power' | 'newest' | undefined,
            limit: typeof req.query.limit === 'number' ? req.query.limit : undefined,
            cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
        });

        sendSuccess(res, result);
    } catch (error: unknown) {
        if (error instanceof Error) {
            sendError(res, error.message, 500);
            return;
        }
        sendError(res, 'Failed to search users', 500);
    }
});

export default router;
