import { describe, it, expect, vi } from 'vitest';
import * as supportController from './support.controller.js';
import * as supportService from './support.service.js';

vi.mock('./support.service.js', () => ({
    createSupportTicket: vi.fn(),
    listSupportTickets: vi.fn(),
    getSupportTicketDetail: vi.fn(),
    updateSupportTicket: vi.fn(),
    replyToSupportTicket: vi.fn(),
    processDueOutboxJobs: vi.fn(),
}));

const createResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('support.controller', () => {
    it('creates support ticket and returns ticket reference', async () => {
        vi.mocked(supportService.createSupportTicket).mockResolvedValueOnce({
            ticketId: 't1',
            ticketRef: 'SUP-20260302-ABCD',
            queuedEmails: 2,
            status: 'open',
        });

        const req: any = {
            body: {
                name: 'Test User',
                email: 'test@example.com',
                subject: 'Support',
                message: 'Need help with mission posting',
            },
            user: { uid: 'u1' },
            ip: '127.0.0.1',
            get: vi.fn().mockReturnValue('unit-test'),
        };
        const res = createResponse();

        await supportController.createTicket(req, res);

        expect(res.status).toHaveBeenCalledWith(202);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    ticketRef: 'SUP-20260302-ABCD',
                    queuedEmails: 2,
                }),
            })
        );
    });

    it('returns 404 when support ticket detail is missing', async () => {
        vi.mocked(supportService.getSupportTicketDetail).mockResolvedValueOnce(null);

        const req: any = { params: { ticketId: 'missing' } };
        const res = createResponse();

        await supportController.getAdminTicketDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 401 for ticket patch when user is missing', async () => {
        const req: any = { params: { ticketId: 't1' }, body: { status: 'resolved' }, user: undefined };
        const res = createResponse();

        await supportController.patchAdminTicket(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(supportService.updateSupportTicket).not.toHaveBeenCalled();
    });

    it('queues admin reply and returns 202', async () => {
        vi.mocked(supportService.replyToSupportTicket).mockResolvedValueOnce(true);

        const req: any = {
            params: { ticketId: 't1' },
            body: { message: 'Thanks, this is now fixed.' },
            user: { uid: 'admin-1' },
        };
        const res = createResponse();

        await supportController.postAdminReply(req, res);

        expect(supportService.replyToSupportTicket).toHaveBeenCalledWith('t1', {
            adminId: 'admin-1',
            message: 'Thanks, this is now fixed.',
        });
        expect(res.status).toHaveBeenCalledWith(202);
    });
});

