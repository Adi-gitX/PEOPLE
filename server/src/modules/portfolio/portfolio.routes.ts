import { Router, Request, Response } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import * as portfolioService from './portfolio.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const router = Router();

const parseReorderPayload = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((entry) => `${entry}`.trim()).filter(Boolean);
    }
    return [];
};

const getMyPortfolio = async (req: Request, res: Response) => {
    try {
        const items = await portfolioService.getPortfolioForUser(req.user!.uid);
        sendSuccess(res, { items, count: items.length });
    } catch {
        sendError(res, 'Failed to get portfolio', 500);
    }
};

router.get('/my', requireAuth, getMyPortfolio);
router.get('/me', requireAuth, getMyPortfolio);

router.get('/user/:userId', optionalAuth, async (req, res) => {
    try {
        const items = await portfolioService.getPortfolioForUser(req.params.userId);
        sendSuccess(res, { items, count: items.length });
    } catch {
        sendError(res, 'Failed to get portfolio', 500);
    }
});

router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const item = await portfolioService.getPortfolioItemById(req.params.id);
        if (!item) {
            sendError(res, 'Item not found', 404);
            return;
        }
        await portfolioService.incrementViews(req.params.id);
        sendSuccess(res, { item });
    } catch {
        sendError(res, 'Failed to get portfolio item', 500);
    }
});

router.post('/me/items', requireAuth, async (req, res) => {
    try {
        const item = await portfolioService.createPortfolioItem(req.user!.uid, req.body);
        sendSuccess(res, { item }, 201);
    } catch (error: unknown) {
        if (error instanceof Error) {
            sendError(res, error.message, 400);
            return;
        }
        sendError(res, 'Failed to create portfolio item', 400);
    }
});

router.patch('/me/items/:itemId', requireAuth, async (req, res) => {
    try {
        const item = await portfolioService.updatePortfolioItem(
            req.params.itemId,
            req.user!.uid,
            req.body
        );
        sendSuccess(res, { item });
    } catch (error: unknown) {
        if (error instanceof Error) {
            const status = error.message === 'Portfolio item not found' ? 404 : 400;
            sendError(res, error.message, status);
            return;
        }
        sendError(res, 'Failed to update portfolio item', 400);
    }
});

router.delete('/me/items/:itemId', requireAuth, async (req, res) => {
    try {
        await portfolioService.deletePortfolioItem(req.params.itemId, req.user!.uid);
        sendSuccess(res, { success: true });
    } catch (error: unknown) {
        if (error instanceof Error) {
            const status = error.message === 'Portfolio item not found' ? 404 : 400;
            sendError(res, error.message, status);
            return;
        }
        sendError(res, 'Failed to delete portfolio item', 400);
    }
});

router.patch('/me/reorder', requireAuth, async (req, res) => {
    try {
        const itemIds = parseReorderPayload(req.body?.itemIds);
        await portfolioService.reorderPortfolioItems(req.user!.uid, itemIds);
        sendSuccess(res, { success: true });
    } catch (error: unknown) {
        if (error instanceof Error) {
            sendError(res, error.message, 400);
            return;
        }
        sendError(res, 'Failed to reorder portfolio items', 400);
    }
});

// Backward-compatible aliases
router.post('/', requireAuth, async (req, res) => {
    try {
        const item = await portfolioService.createPortfolioItem(req.user!.uid, req.body);
        sendSuccess(res, { item }, 201);
    } catch (error: unknown) {
        if (error instanceof Error) {
            sendError(res, error.message, 400);
            return;
        }
        sendError(res, 'Failed to create portfolio item', 400);
    }
});

router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const item = await portfolioService.updatePortfolioItem(req.params.id, req.user!.uid, req.body);
        sendSuccess(res, { item });
    } catch (error: unknown) {
        if (error instanceof Error) {
            const status = error.message === 'Portfolio item not found' ? 404 : 400;
            sendError(res, error.message, status);
            return;
        }
        sendError(res, 'Failed to update portfolio item', 400);
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        await portfolioService.deletePortfolioItem(req.params.id, req.user!.uid);
        sendSuccess(res, { success: true });
    } catch (error: unknown) {
        if (error instanceof Error) {
            const status = error.message === 'Portfolio item not found' ? 404 : 400;
            sendError(res, error.message, status);
            return;
        }
        sendError(res, 'Failed to delete portfolio item', 400);
    }
});

export default router;
