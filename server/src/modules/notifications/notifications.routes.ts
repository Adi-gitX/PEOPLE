import { Router } from 'express';
import * as notificationsController from './notifications.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, notificationsController.getMyNotifications);

router.get('/count', requireAuth, notificationsController.getUnreadCount);

router.patch('/:id/read', requireAuth, notificationsController.markAsRead);

router.post('/read-all', requireAuth, notificationsController.markAllAsRead);

router.delete('/:id', requireAuth, notificationsController.deleteNotification);

router.patch('/:id/archive', requireAuth, notificationsController.archiveNotification);

export default router;
