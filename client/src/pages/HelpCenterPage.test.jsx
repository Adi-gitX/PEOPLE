import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import HelpCenterPage from './HelpCenterPage';

vi.mock('../components/layout/PublicLayout', () => ({
    PublicLayout: ({ children }) => <div>{children}</div>,
}));

describe('HelpCenterPage', () => {
    it('routes support actions to real app routes', () => {
        render(
            <MemoryRouter>
                <HelpCenterPage />
            </MemoryRouter>
        );

        const contactFormLinks = screen.getAllByRole('link', { name: /contact form/i });
        expect(contactFormLinks.some((link) => link.getAttribute('href') === '/contact')).toBe(true);

        const faqLink = screen.getByRole('link', { name: /faq/i });
        expect(faqLink).toHaveAttribute('href', '/faq');
    });

    it('shows article actions as disabled with explanation', () => {
        render(
            <MemoryRouter>
                <HelpCenterPage />
            </MemoryRouter>
        );

        const articleButton = screen.getByRole('button', { name: /Create your first mission/i });
        expect(articleButton).toBeDisabled();
        expect(articleButton).toHaveAttribute('title', expect.stringMatching(/knowledge-base/i));
    });
});
