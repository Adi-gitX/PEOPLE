import { describe, it, expect, vi } from 'vitest';
import * as notificationsController from './notifications.controller.js';
import * as notificationsService from './notifications.service.js';

vi.mock('./notifications.service.js', () => ({
    markAsRead: vi.fn(),
    archiveNotification: vi.fn(),
    deleteNotification: vi.fn(),
    getUserNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAllAsRead: vi.fn(),
}));

const createResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res;
};

describe('notifications.controller ownership handling', () => {
    it('returns 403 when notification ownership check fails', async () => {
        vi.mocked(notificationsService.markAsRead).mockRejectedValueOnce(new Error('Forbidden'));

        const req: any = {
            user: { uid: 'owner-1' },
            params: { id: 'notification-1' },
        };
        const res = createResponse();

        await notificationsController.markAsRead(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 200 when marking own notification as read', async () => {
        vi.mocked(notificationsService.markAsRead).mockResolvedValueOnce();

        const req: any = {
            user: { uid: 'owner-1' },
            params: { id: 'notification-1' },
        };
        const res = createResponse();

        await notificationsController.markAsRead(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true })
        );
    });
});
