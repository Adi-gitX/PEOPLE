// Rate Limiting Middleware
// Protects API from abuse and DDoS attacks

import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const stores: { [key: string]: RateLimitStore } = {};

interface RateLimitOptions {
    windowMs: number;
    max: number;
    message?: string;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}

const createRateLimiter = (name: string, options: RateLimitOptions) => {
    const store: RateLimitStore = {};
    stores[name] = store;

    const {
        windowMs,
        max,
        message = 'Too many requests, please try again later',
        keyGenerator = (req: Request) => req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
    } = options;

    return (req: Request, res: Response, next: NextFunction): void => {
        const key = keyGenerator(req);
        const now = Date.now();

        // Clean expired entries periodically
        if (Math.random() < 0.01) {
            Object.keys(store).forEach(k => {
                if (store[k].resetTime < now) {
                    delete store[k];
                }
            });
        }

        // Get or create entry
        if (!store[key] || store[key].resetTime < now) {
            store[key] = {
                count: 0,
                resetTime: now + windowMs,
            };
        }

        const entry = store[key];

        // Check if exceeded
        if (entry.count >= max) {
            res.status(429).json({
                error: 'Rate limit exceeded',
                message,
                retryAfter: Math.ceil((entry.resetTime - now) / 1000),
            });
            return;
        }

        // Increment count
        entry.count++;

        // Set headers
        res.setHeader('X-RateLimit-Limit', max.toString());
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count).toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());

        // Handle skip options
        if (skipSuccessfulRequests || skipFailedRequests) {
            const originalEnd = res.end.bind(res);
            res.end = function (...args: any[]): Response {
                if (skipSuccessfulRequests && res.statusCode < 400) {
                    entry.count = Math.max(0, entry.count - 1);
                }
                if (skipFailedRequests && res.statusCode >= 400) {
                    entry.count = Math.max(0, entry.count - 1);
                }
                return originalEnd(...args);
            } as typeof res.end;
        }

        next();
    };
};

// Standard API rate limiter
export const apiLimiter = createRateLimiter('api', {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                  // 100 requests per 15 min
    message: 'Too many API requests, please try again later',
});

// Strict limiter for authentication endpoints
export const authLimiter = createRateLimiter('auth', {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,                   // 10 attempts per hour
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true,
});

// Strict limiter for OTP/verification
export const otpLimiter = createRateLimiter('otp', {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                    // 5 OTP requests per 15 min
    message: 'Too many verification requests, please wait before trying again',
});

// Limiter for file uploads
export const uploadLimiter = createRateLimiter('upload', {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,                   // 50 uploads per hour
    message: 'Upload limit reached, please try again later',
});

// Limiter for search/heavy operations
export const searchLimiter = createRateLimiter('search', {
    windowMs: 60 * 1000,      // 1 minute
    max: 30,                   // 30 searches per minute
    message: 'Too many search requests, please slow down',
});

// Limiter for payment operations
export const paymentLimiter = createRateLimiter('payment', {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,                   // 20 payment operations per hour
    message: 'Too many payment requests, please try again later',
});

// Get rate limit stats (for admin/monitoring)
export const getRateLimitStats = () => {
    const stats: Record<string, { activeKeys: number; totalRequests: number }> = {};

    for (const [name, store] of Object.entries(stores)) {
        const keys = Object.keys(store);
        const totalRequests = Object.values(store).reduce((sum, entry) => sum + entry.count, 0);
        stats[name] = {
            activeKeys: keys.length,
            totalRequests,
        };
    }

    return stats;
};
