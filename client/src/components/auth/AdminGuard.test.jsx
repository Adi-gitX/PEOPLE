import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminGuard } from './AdminGuard';
import { useAuthStore } from '../../store/useAuthStore';

vi.mock('../../store/useAuthStore', () => ({
    useAuthStore: vi.fn(),
}));

const renderGuard = () => {
    return render(
        <MemoryRouter initialEntries={['/admin']}>
            <Routes>
                <Route path="/admin" element={<AdminGuard><div>Admin Content</div></AdminGuard>} />
                <Route path="/login" element={<div>Login Page</div>} />
                <Route path="/dashboard/contributor" element={<div>Contributor Dashboard</div>} />
                <Route path="/dashboard/initiator" element={<div>Initiator Dashboard</div>} />
            </Routes>
        </MemoryRouter>
    );
};

describe('AdminGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('redirects unauthenticated users to login', async () => {
        useAuthStore.mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            role: null,
            refreshProfile: vi.fn(),
        });

        renderGuard();
        expect(await screen.findByText('Login Page')).toBeInTheDocument();
    });

    it('blocks non-admin users', async () => {
        useAuthStore.mockReturnValue({
            user: { uid: 'u1' },
            isAuthenticated: true,
            isLoading: false,
            role: 'contributor',
            refreshProfile: vi.fn(),
        });

        renderGuard();
        expect(await screen.findByText('Access Denied')).toBeInTheDocument();
    });

    it('allows admin users', async () => {
        useAuthStore.mockReturnValue({
            user: { uid: 'a1' },
            isAuthenticated: true,
            isLoading: false,
            role: 'admin',
            refreshProfile: vi.fn(),
        });

        renderGuard();
        expect(await screen.findByText('Admin Content')).toBeInTheDocument();
    });
});
