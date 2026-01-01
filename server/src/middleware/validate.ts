import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
            const validated = schema.parse(data);

            // Replace the source with validated data
            if (source === 'body') {
                req.body = validated;
            } else if (source === 'query') {
                req.query = validated;
            } else {
                req.params = validated;
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Validation Error',
                    message: 'Invalid request data',
                    details: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }

            next(error);
        }
    };
};

/**
 * Validates multiple sources at once
 */
export const validateAll = (schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors: Array<{ source: string; field: string; message: string }> = [];

        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
        } catch (error) {
            if (error instanceof ZodError) {
                errors.push(...error.errors.map(e => ({
                    source: 'body',
                    field: e.path.join('.'),
                    message: e.message,
                })));
            }
        }

        try {
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
        } catch (error) {
            if (error instanceof ZodError) {
                errors.push(...error.errors.map(e => ({
                    source: 'query',
                    field: e.path.join('.'),
                    message: e.message,
                })));
            }
        }

        try {
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
        } catch (error) {
            if (error instanceof ZodError) {
                errors.push(...error.errors.map(e => ({
                    source: 'params',
                    field: e.path.join('.'),
                    message: e.message,
                })));
            }
        }

        if (errors.length > 0) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid request data',
                details: errors,
            });
            return;
        }

        next();
    };
};
