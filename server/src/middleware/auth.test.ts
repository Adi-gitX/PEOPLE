import { describe, it, expect, vi } from 'vitest';
import { requireRole } from './auth.js';

const createResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('requireRole middleware', () => {
    it('returns 401 when user is missing', async () => {
        const middleware = requireRole(['admin']);
        const req: any = { user: undefined };
        const res = createResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('allows request when role is authorized', async () => {
        const middleware = requireRole(['admin']);
        const req: any = { user: { uid: 'u1' }, userRole: 'admin' };
        const res = createResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 403 when role is unauthorized', async () => {
        const middleware = requireRole(['admin']);
        const req: any = { user: { uid: 'u1' }, userRole: 'contributor' };
        const res = createResponse();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});
