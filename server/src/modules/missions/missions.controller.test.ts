import { describe, it, expect, vi } from 'vitest';
import * as missionsController from './missions.controller.js';
import * as missionsService from './missions.service.js';

vi.mock('./missions.service.js', () => ({
    withdrawApplication: vi.fn(),
}));

vi.mock('../notifications/notifications.service.js', () => ({}));

const createResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('missions.controller withdrawApplication', () => {
    it('returns 401 when user id is missing', async () => {
        const req: any = { user: undefined, params: { id: 'm1', applicationId: 'a1' } };
        const res = createResponse();

        await missionsController.withdrawApplication(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 on ownership violation', async () => {
        vi.mocked(missionsService.withdrawApplication).mockRejectedValueOnce(new Error('Not authorized'));
        const req: any = { user: { uid: 'u1' }, params: { id: 'm1', applicationId: 'a1' } };
        const res = createResponse();

        await missionsController.withdrawApplication(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 200 on successful withdrawal', async () => {
        vi.mocked(missionsService.withdrawApplication).mockResolvedValueOnce();
        const req: any = { user: { uid: 'u1' }, params: { id: 'm1', applicationId: 'a1' } };
        const res = createResponse();

        await missionsController.withdrawApplication(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true })
        );
    });
});
