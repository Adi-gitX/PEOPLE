import express from 'express';
import { once } from 'events';
import type { AddressInfo } from 'net';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { createTicketMock } = vi.hoisted(() => ({
    createTicketMock: vi.fn((_req, res) => {
        res.status(202).json({
            success: true,
            data: {
                ticketRef: 'SUP-TEST-20260302',
            },
        });
    }),
}));

vi.mock('../support/support.controller.js', () => ({
    createTicket: createTicketMock,
}));

import contactRoutes from './contact.routes.js';

describe('contact.routes alias integration', () => {
    let server: ReturnType<typeof appListen>;
    let baseUrl = '';

    function appListen() {
        const app = express();
        app.use(express.json());
        app.use('/api/v1/contact', contactRoutes);
        return app.listen(0);
    }

    beforeAll(async () => {
        server = appListen();
        await once(server, 'listening');
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
    });

    afterAll(async () => {
        if (!server) return;
        await new Promise<void>((resolve, reject) => {
            server.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 202 for valid contact payload', async () => {
        const response = await fetch(`${baseUrl}/api/v1/contact`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                subject: 'Support question',
                message: 'This is a valid support message body.',
                category: 'general',
                source: 'contact_page',
            }),
        });

        expect(response.status).toBe(202);
        expect(createTicketMock).toHaveBeenCalledTimes(1);
    });

    it('returns 400 with validation details for invalid payload', async () => {
        const response = await fetch(`${baseUrl}/api/v1/contact`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                name: 'T',
                email: 'not-an-email',
                subject: '',
                message: 'short',
            }),
        });

        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload).toEqual(
            expect.objectContaining({
                error: 'Validation Error',
                details: expect.any(Array),
            })
        );
        expect(createTicketMock).not.toHaveBeenCalled();
    });
});
