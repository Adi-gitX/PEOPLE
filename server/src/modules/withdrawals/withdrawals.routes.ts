import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as withdrawalsService from './withdrawals.service.js';

const router = Router();

// Get withdrawal balance info
router.get('/balance', requireAuth, async (req, res) => {
    try {
        const available = await withdrawalsService.getAvailableBalance(req.user!.uid);
        const pending = await withdrawalsService.getPendingWithdrawals(req.user!.uid);
        res.json({
            available,
            pending,
            withdrawable: available - pending,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create withdrawal request
router.post('/', requireAuth, async (req, res) => {
    try {
        const withdrawal = await withdrawalsService.createWithdrawal(req.user!.uid, req.body);
        res.status(201).json(withdrawal);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get withdrawal history
router.get('/history', requireAuth, async (req, res) => {
    try {
        const withdrawals = await withdrawalsService.getWithdrawalHistory(req.user!.uid);
        res.json({ withdrawals });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel withdrawal
router.post('/:id/cancel', requireAuth, async (req, res) => {
    try {
        await withdrawalsService.cancelWithdrawal(req.params.id, req.user!.uid);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get payout settings
router.get('/settings', requireAuth, async (req, res) => {
    try {
        const settings = await withdrawalsService.getPayoutSettings(req.user!.uid);
        res.json(settings || {});
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update payout settings
router.put('/settings', requireAuth, async (req, res) => {
    try {
        await withdrawalsService.updatePayoutSettings(req.user!.uid, req.body);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
