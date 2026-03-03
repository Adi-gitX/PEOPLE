import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as paymentsController from './payments.controller.js';
import * as paymentsService from './payments.service.js';

const { collectionMock, docMock, getMock } = vi.hoisted(() => ({
    collectionMock: vi.fn(),
    docMock: vi.fn(),
    getMock: vi.fn(),
}));

vi.mock('./payments.service.js', () => ({
    getMissionPayments: vi.fn(),
}));

vi.mock('../../config/firebase.js', () => ({
    db: {
        collection: collectionMock,
    },
}));

const createResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('payments.controller getMissionPayments', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        collectionMock.mockReturnValue({ doc: docMock });
        docMock.mockReturnValue({ get: getMock });
    });

    it('returns 401 when user is missing', async () => {
        const req: any = { user: undefined, params: { missionId: 'm1' } };
        const res = createResponse();

        await paymentsController.getMissionPayments(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(paymentsService.getMissionPayments).not.toHaveBeenCalled();
    });

    it('returns 404 when mission does not exist', async () => {
        getMock.mockResolvedValueOnce({ exists: false });

        const req: any = { user: { uid: 'u1' }, userRole: 'initiator', params: { missionId: 'm1' } };
        const res = createResponse();

        await paymentsController.getMissionPayments(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(paymentsService.getMissionPayments).not.toHaveBeenCalled();
    });

    it('returns 403 for unrelated non-admin user', async () => {
        getMock.mockResolvedValueOnce({
            exists: true,
            data: () => ({ initiatorId: 'initiator-owner' }),
        });

        const req: any = { user: { uid: 'someone-else' }, userRole: 'initiator', params: { missionId: 'm1' } };
        const res = createResponse();

        await paymentsController.getMissionPayments(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(paymentsService.getMissionPayments).not.toHaveBeenCalled();
    });

    it('returns payments for mission owner', async () => {
        getMock.mockResolvedValueOnce({
            exists: true,
            data: () => ({ initiatorId: 'owner-1' }),
        });
        vi.mocked(paymentsService.getMissionPayments).mockResolvedValueOnce([{ id: 'p1' }] as any);

        const req: any = { user: { uid: 'owner-1' }, userRole: 'initiator', params: { missionId: 'm1' } };
        const res = createResponse();

        await paymentsController.getMissionPayments(req, res);

        expect(paymentsService.getMissionPayments).toHaveBeenCalledWith('m1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: { payments: [{ id: 'p1' }] },
            })
        );
    });

    it('returns payments for admin', async () => {
        getMock.mockResolvedValueOnce({
            exists: true,
            data: () => ({ initiatorId: 'owner-2' }),
        });
        vi.mocked(paymentsService.getMissionPayments).mockResolvedValueOnce([{ id: 'p-admin' }] as any);

        const req: any = { user: { uid: 'admin-1' }, userRole: 'admin', params: { missionId: 'm2' } };
        const res = createResponse();

        await paymentsController.getMissionPayments(req, res);

        expect(paymentsService.getMissionPayments).toHaveBeenCalledWith('m2');
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
