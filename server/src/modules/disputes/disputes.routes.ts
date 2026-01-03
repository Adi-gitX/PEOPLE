// Disputes Module - Routes

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as disputesService from './disputes.service.js';

const router = Router();

// Create a dispute
router.post('/', requireAuth, async (req, res) => {
    try {
        const dispute = await disputesService.createDispute(
            req.user!.uid,
            req.user!.name || 'User',
            req.body
        );

        res.status(201).json({ dispute });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get my disputes
router.get('/my', requireAuth, async (req, res) => {
    try {
        const disputes = await disputesService.getDisputesForUser(req.user!.uid);
        res.json({ disputes, count: disputes.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get dispute by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const dispute = await disputesService.getDisputeById(req.params.id);

        if (!dispute) {
            res.status(404).json({ error: 'Dispute not found' });
            return;
        }

        // Verify user is involved or admin
        if (dispute.raisedBy !== req.user!.uid &&
            dispute.against !== req.user!.uid &&
            req.user!.role !== 'admin') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.json({ dispute });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Add response to dispute
router.post('/:id/respond', requireAuth, async (req, res) => {
    try {
        const dispute = await disputesService.addDisputeResponse(
            req.params.id,
            req.user!.uid,
            req.body.response
        );

        res.json({ dispute });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Add evidence
router.post('/:id/evidence', requireAuth, async (req, res) => {
    try {
        const dispute = await disputesService.addEvidence(
            req.params.id,
            req.user!.uid,
            req.body.evidenceUrl
        );

        res.json({ dispute });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Escalate dispute
router.post('/:id/escalate', requireAuth, async (req, res) => {
    try {
        const dispute = await disputesService.escalateDispute(
            req.params.id,
            req.user!.uid,
            req.body.reason
        );

        res.json({ dispute });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Admin: Get all disputes
router.get('/admin/all', requireAuth, async (req, res) => {
    try {
        // TODO: Add admin check
        const status = req.query.status as string | undefined;
        const limit = parseInt(req.query.limit as string) || 50;

        const disputes = await disputesService.getAllDisputes(status, limit);
        res.json({ disputes, count: disputes.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Resolve dispute
router.post('/:id/resolve', requireAuth, async (req, res) => {
    try {
        // TODO: Add admin check
        const { resolution, notes } = req.body;

        const dispute = await disputesService.resolveDispute(
            req.params.id,
            req.user!.uid,
            resolution,
            notes
        );

        res.json({ dispute });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
