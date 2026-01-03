// Favorites Module - Routes

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as favoritesService from './favorites.service.js';

const router = Router();

// Get all favorites
router.get('/', requireAuth, async (req, res) => {
    try {
        const type = req.query.type as any;
        const favorites = await favoritesService.getFavoritesForUser(req.user!.uid, type);
        res.json({ favorites, count: favorites.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Check if item is favorited
router.get('/check/:type/:itemId', requireAuth, async (req, res) => {
    try {
        const favorited = await favoritesService.isFavorite(
            req.user!.uid,
            req.params.type as any,
            req.params.itemId
        );
        res.json({ favorited });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Add favorite
router.post('/:type/:itemId', requireAuth, async (req, res) => {
    try {
        const favorite = await favoritesService.addFavorite(
            req.user!.uid,
            req.params.type as any,
            req.params.itemId,
            req.body.title,
            req.body.data
        );
        res.status(201).json({ favorite });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Toggle favorite
router.post('/toggle/:type/:itemId', requireAuth, async (req, res) => {
    try {
        const result = await favoritesService.toggleFavorite(
            req.user!.uid,
            req.params.type as any,
            req.params.itemId,
            req.body.title
        );
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Remove favorite
router.delete('/:type/:itemId', requireAuth, async (req, res) => {
    try {
        await favoritesService.removeFavorite(
            req.user!.uid,
            req.params.type as any,
            req.params.itemId
        );
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
