// Portfolio Module - Routes

import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import * as portfolioService from './portfolio.service.js';

const router = Router();

// Get portfolio for current user
router.get('/my', requireAuth, async (req, res) => {
    try {
        const items = await portfolioService.getPortfolioForUser(req.user!.uid);
        res.json({ items, count: items.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get portfolio for any user (public)
router.get('/user/:userId', optionalAuth, async (req, res) => {
    try {
        const items = await portfolioService.getPortfolioForUser(req.params.userId);
        res.json({ items, count: items.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get single item
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const item = await portfolioService.getPortfolioItemById(req.params.id);
        if (!item) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }
        // Increment views
        await portfolioService.incrementViews(req.params.id);
        res.json({ item });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create item
router.post('/', requireAuth, async (req, res) => {
    try {
        const item = await portfolioService.createPortfolioItem(req.user!.uid, req.body);
        res.status(201).json({ item });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Update item
router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const item = await portfolioService.updatePortfolioItem(
            req.params.id,
            req.user!.uid,
            req.body
        );
        res.json({ item });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Delete item
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        await portfolioService.deletePortfolioItem(req.params.id, req.user!.uid);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
