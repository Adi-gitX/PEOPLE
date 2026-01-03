// Invoices Module - Routes

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as invoicesService from './invoices.service.js';

const router = Router();

// Get my invoices
router.get('/', requireAuth, async (req, res) => {
    try {
        const invoices = await invoicesService.getInvoicesForUser(req.user!.uid);
        res.json({ invoices, count: invoices.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get invoice by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const invoice = await invoicesService.getInvoiceById(req.params.id);

        if (!invoice) {
            res.status(404).json({ error: 'Invoice not found' });
            return;
        }

        if (invoice.fromUserId !== req.user!.uid && invoice.toUserId !== req.user!.uid) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.json({ invoice });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create invoice
router.post('/', requireAuth, async (req, res) => {
    try {
        const { missionId, items } = req.body;
        const invoice = await invoicesService.createInvoice(missionId, req.user!.uid, items);
        res.status(201).json({ invoice });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Generate invoice from mission
router.post('/generate/:missionId', requireAuth, async (req, res) => {
    try {
        const invoice = await invoicesService.generateMissionInvoice(req.params.missionId);
        res.status(201).json({ invoice });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Update invoice status
router.patch('/:id/status', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const invoice = await invoicesService.updateInvoiceStatus(req.params.id, status);
        res.json({ invoice });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
