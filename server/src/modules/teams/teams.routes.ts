// Teams Module - Routes

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as teamsService from './teams.service.js';

const router = Router();

// Get my teams
router.get('/my', requireAuth, async (req, res) => {
    try {
        const teams = await teamsService.getTeamsForUser(req.user!.uid);
        res.json({ teams, count: teams.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get team by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const team = await teamsService.getTeamById(req.params.id);
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }
        res.json({ team });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get team by slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const team = await teamsService.getTeamBySlug(req.params.slug);
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }
        res.json({ team });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create team
router.post('/', requireAuth, async (req, res) => {
    try {
        const team = await teamsService.createTeam(
            req.user!.uid,
            req.user!.name || 'User',
            req.body
        );
        res.status(201).json({ team });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Update team
router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const team = await teamsService.updateTeam(req.params.id, req.user!.uid, req.body);
        res.json({ team });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Delete team
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        await teamsService.deleteTeam(req.params.id, req.user!.uid);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Add member
router.post('/:id/members', requireAuth, async (req, res) => {
    try {
        const team = await teamsService.addTeamMember(req.params.id, req.user!.uid, req.body);
        res.json({ team });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Remove member
router.delete('/:id/members/:memberId', requireAuth, async (req, res) => {
    try {
        const team = await teamsService.removeTeamMember(
            req.params.id,
            req.user!.uid,
            req.params.memberId
        );
        res.json({ team });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
