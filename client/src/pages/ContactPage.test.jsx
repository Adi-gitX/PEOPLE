import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContactPage from './ContactPage';
import { api } from '../lib/api';
import { toast } from 'sonner';

vi.mock('../components/layout/PublicLayout', () => ({
    PublicLayout: ({ children }) => <div>{children}</div>,
}));

vi.mock('../lib/api', () => ({
    api: {
        post: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('ContactPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const fillRequiredFields = () => {
        fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    };

    it('blocks submit when message is shorter than required minimum', async () => {
        render(
            <MemoryRouter>
                <ContactPage />
            </MemoryRouter>
        );

        fillRequiredFields();
        fireEvent.change(screen.getByPlaceholderText('Describe your issue in detail...'), {
            target: { value: 'short' },
        });

        const submitButton = screen.getByRole('button', { name: /submit query/i });
        expect(submitButton).toBeDisabled();
        fireEvent.click(submitButton);

        expect(api.post).not.toHaveBeenCalled();
        expect(await screen.findByText(/Message must be at least 10 characters/i)).toBeInTheDocument();
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('blocks submit with invalid email', async () => {
        render(
            <MemoryRouter>
                <ContactPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'invalid-email' } });
        fireEvent.change(screen.getByPlaceholderText('Describe your issue in detail...'), {
            target: { value: 'This message has enough characters to pass validation.' },
        });

        fireEvent.click(screen.getByRole('button', { name: /submit query/i }));

        expect(api.post).not.toHaveBeenCalled();
        expect(await screen.findByText(/Enter a valid email address/i)).toBeInTheDocument();
    });

    it('blocks submit for whitespace-only message', async () => {
        render(
            <MemoryRouter>
                <ContactPage />
            </MemoryRouter>
        );

        fillRequiredFields();
        fireEvent.change(screen.getByPlaceholderText('Describe your issue in detail...'), {
            target: { value: '          ' },
        });

        fireEvent.click(screen.getByRole('button', { name: /submit query/i }));
        expect(api.post).not.toHaveBeenCalled();
        expect(await screen.findByText(/Message is required/i)).toBeInTheDocument();
    });

    it('submits support form and shows ticket reference', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({
            data: { ticketRef: 'SUP-20260302-ABCD' },
        });

        render(
            <MemoryRouter>
                <ContactPage />
            </MemoryRouter>
        );

        fillRequiredFields();
        fireEvent.change(screen.getByPlaceholderText('Describe your issue in detail...'), {
            target: { value: 'I need help connecting payment and profile flows.' },
        });

        fireEvent.click(screen.getByRole('button', { name: /submit query/i }));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/api/v1/contact', expect.objectContaining({
                source: 'contact_page',
                category: 'general',
            }));
        });

        expect(await screen.findByText(/Ticket SUP-20260302-ABCD has been created/i)).toBeInTheDocument();
    });

    it('shows field errors returned from backend validation response', async () => {
        const backendError = new Error('Invalid request');
        backendError.status = 400;
        backendError.details = [
            { field: 'email', message: 'Invalid email' },
            { field: 'message', message: 'String must contain at least 10 character(s)' },
        ];
        vi.mocked(api.post).mockRejectedValueOnce(backendError);

        render(
            <MemoryRouter>
                <ContactPage />
            </MemoryRouter>
        );

        fillRequiredFields();
        fireEvent.change(screen.getByPlaceholderText('Describe your issue in detail...'), {
            target: { value: 'This message has enough characters to submit.' },
        });

        fireEvent.click(screen.getByRole('button', { name: /submit query/i }));

        expect(await screen.findByText(/Invalid email/i)).toBeInTheDocument();
        expect(await screen.findByText(/String must contain at least 10 character\(s\)/i)).toBeInTheDocument();
    });
});
