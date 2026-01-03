import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as proposalsService from './proposals.service.js';

const router = Router();

// Create proposal
router.post('/', requireAuth, async (req, res) => {
    try {
        const proposal = await proposalsService.createProposal(req.user!.uid, req.body);
        res.status(201).json(proposal);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get my proposals (contributor)
router.get('/my', requireAuth, async (req, res) => {
    try {
        const proposals = await proposalsService.getContributorProposals(req.user!.uid);
        res.json({ proposals });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get proposals for a mission (initiator)
router.get('/mission/:missionId', requireAuth, async (req, res) => {
    try {
        const proposals = await proposalsService.getMissionProposals(req.params.missionId);
        res.json({ proposals });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get single proposal
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const proposal = await proposalsService.getProposalById(req.params.id);
        if (!proposal) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }
        res.json(proposal);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Accept proposal (initiator)
router.post('/:id/accept', requireAuth, async (req, res) => {
    try {
        const proposal = await proposalsService.acceptProposal(req.params.id);
        res.json(proposal);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Reject proposal (initiator)
router.post('/:id/reject', requireAuth, async (req, res) => {
    try {
        await proposalsService.updateProposalStatus(req.params.id, 'rejected');
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Withdraw proposal (contributor)
router.post('/:id/withdraw', requireAuth, async (req, res) => {
    try {
        await proposalsService.withdrawProposal(req.params.id, req.user!.uid);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
