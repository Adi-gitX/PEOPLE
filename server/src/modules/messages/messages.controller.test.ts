import { describe, it, expect, vi } from 'vitest';
import * as messagesController from './messages.controller.js';
import * as messagesService from './messages.service.js';

vi.mock('./messages.service.js', () => ({
    getConversationById: vi.fn(),
    markConversationAsRead: vi.fn(),
    getUserConversations: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    getOrCreateDirectConversation: vi.fn(),
}));

vi.mock('../../config/firebase.js', () => ({
    db: {
        collection: vi.fn(),
    },
}));

const createResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('messages.controller markConversationRead', () => {
    it('returns 403 for non-participant', async () => {
        vi.mocked(messagesService.getConversationById).mockResolvedValueOnce({
            id: 'c1',
            type: 'direct',
            participants: ['other-user'],
        } as any);

        const req: any = { user: { uid: 'u1' }, params: { id: 'c1' } };
        const res = createResponse();

        await messagesController.markConversationRead(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(messagesService.markConversationAsRead).not.toHaveBeenCalled();
    });

    it('marks conversation as read for participant', async () => {
        vi.mocked(messagesService.getConversationById).mockResolvedValueOnce({
            id: 'c1',
            type: 'direct',
            participants: ['u1', 'u2'],
        } as any);
        vi.mocked(messagesService.markConversationAsRead).mockResolvedValueOnce(3);

        const req: any = { user: { uid: 'u1' }, params: { id: 'c1' } };
        const res = createResponse();

        await messagesController.markConversationRead(req, res);

        expect(messagesService.markConversationAsRead).toHaveBeenCalledWith('c1', 'u1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({ updatedCount: 3 }),
            })
        );
    });
});
