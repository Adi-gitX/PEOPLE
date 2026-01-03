import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as contractsService from './contracts.service.js';

const router = Router();

// Create contract
router.post('/', requireAuth, async (req, res) => {
    try {
        const contract = await contractsService.createContract(req.user!.uid, req.body);
        res.status(201).json(contract);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get my contracts
router.get('/my', requireAuth, async (req, res) => {
    try {
        const role = req.query.role as 'initiator' | 'contributor' || 'contributor';
        const contracts = await contractsService.getUserContracts(req.user!.uid, role);
        res.json({ contracts });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get contract by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const contract = await contractsService.getContractById(req.params.id);
        if (!contract) {
            res.status(404).json({ error: 'Contract not found' });
            return;
        }
        res.json(contract);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Sign contract (contributor)
router.post('/:id/sign', requireAuth, async (req, res) => {
    try {
        const contract = await contractsService.signContract(req.params.id, req.user!.uid);
        res.json(contract);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Update milestone status
router.patch('/:id/milestones/:milestoneId', requireAuth, async (req, res) => {
    try {
        await contractsService.updateMilestoneStatus(
            req.params.id,
            req.params.milestoneId,
            req.body.status
        );
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
