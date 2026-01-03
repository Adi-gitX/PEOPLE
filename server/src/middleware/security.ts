// Security Middleware
// Adds security headers and protections

import { Request, Response, NextFunction } from 'express';

// Security headers middleware
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Content Security Policy
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https:",
        "connect-src 'self' https:",
        "frame-ancestors 'none'",
    ].join('; '));

    // HSTS (only in production)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    next();
};

// CSRF token generation and validation
const csrfTokens = new Map<string, { token: string; expires: number }>();

export const generateCsrfToken = (sessionId: string): string => {
    const token = generateSecureToken(32);
    csrfTokens.set(sessionId, {
        token,
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // Cleanup old tokens periodically
    if (Math.random() < 0.01) {
        const now = Date.now();
        csrfTokens.forEach((value, key) => {
            if (value.expires < now) {
                csrfTokens.delete(key);
            }
        });
    }

    return token;
};

export const validateCsrfToken = (sessionId: string, token: string): boolean => {
    const stored = csrfTokens.get(sessionId);
    if (!stored) return false;
    if (stored.expires < Date.now()) {
        csrfTokens.delete(sessionId);
        return false;
    }
    return stored.token === token;
};

// Secure random token generation
export const generateSecureToken = (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    const randomValues = new Uint8Array(length);
    require('crypto').randomFillSync(randomValues);
    for (let i = 0; i < length; i++) {
        token += chars[randomValues[i] % chars.length];
    }
    return token;
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
    if (typeof input !== 'string') return input;

    return input
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove on* event handlers
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
        // Escape HTML entities
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
};

// Deep sanitize object
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            result[key] = sanitizeInput(value);
        } else if (Array.isArray(value)) {
            result[key] = value.map(item =>
                typeof item === 'string' ? sanitizeInput(item) : item
            );
        } else if (typeof value === 'object' && value !== null) {
            result[key] = sanitizeObject(value);
        } else {
            result[key] = value;
        }
    }

    return result as T;
};

// Middleware to sanitize request body
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }

    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query as Record<string, any>);
    }

    next();
};

// Validate required fields middleware
export const validateRequired = (fields: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const missing = fields.filter(field => {
            const value = req.body[field];
            return value === undefined || value === null || value === '';
        });

        if (missing.length > 0) {
            res.status(400).json({
                error: 'Validation failed',
                message: `Missing required fields: ${missing.join(', ')}`,
            });
            return;
        }

        next();
    };
};

// SQL injection prevention (for any raw queries)
export const escapeSql = (input: string): string => {
    if (typeof input !== 'string') return input;
    return input.replace(/['";\\]/g, char => '\\' + char);
};

// NoSQL injection prevention
export const sanitizeMongoQuery = (query: any): any => {
    if (typeof query !== 'object' || query === null) return query;

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(query)) {
        // Prevent operator injection
        if (key.startsWith('$')) continue;

        if (typeof value === 'object' && value !== null) {
            // Check for operator objects
            const hasOperator = Object.keys(value).some(k => k.startsWith('$'));
            if (hasOperator) {
                result[key] = String(value);
            } else {
                result[key] = sanitizeMongoQuery(value);
            }
        } else {
            result[key] = value;
        }
    }
    return result;
};
