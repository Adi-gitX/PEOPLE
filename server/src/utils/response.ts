import { Response } from 'express';

/**
 * Standard API response format
 */
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        hasMore?: boolean;
    };
}

/**
 * Send success response
 */
export const sendSuccess = <T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    meta?: ApiResponse<T>['meta']
): Response => {
    const response: ApiResponse<T> = {
        success: true,
        data,
    };

    if (meta) {
        response.meta = meta;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send created response (201)
 */
export const sendCreated = <T>(res: Response, data: T): Response => {
    return sendSuccess(res, data, 201);
};

/**
 * Send no content response (204)
 */
export const sendNoContent = (res: Response): Response => {
    return res.status(204).send();
};

/**
 * Send error response
 */
export const sendError = (
    res: Response,
    message: string,
    statusCode: number = 500,
    details?: unknown
): Response => {
    const response: ApiResponse<null> & { details?: unknown } = {
        success: false,
        error: message,
    };

    if (details) {
        response.details = details;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
export const sendPaginated = <T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number
): Response => {
    return sendSuccess(res, data, 200, {
        page,
        limit,
        total,
        hasMore: page * limit < total,
    });
};
