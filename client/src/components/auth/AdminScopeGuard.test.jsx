import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminScopeGuard } from './AdminScopeGuard';
import { useAuthStore } from '../../store/useAuthStore';

vi.mock('../../store/useAuthStore', () => ({
    useAuthStore: vi.fn(),
}));

const renderGuard = (requiredScopes = []) => {
    return render(
        <MemoryRouter initialEntries={['/admin/messages']}>
            <Routes>
                <Route
                    path="/admin/messages"
                    element={(
                        <AdminScopeGuard requiredScopes={requiredScopes}>
                            <div>Scoped Admin Content</div>
                        </AdminScopeGuard>
                    )}
                />
                <Route path="/admin" element={<div>Admin Home</div>} />
                <Route path="/login" element={<div>Login Page</div>} />
                <Route path="/dashboard/contributor" element={<div>Contributor Dashboard</div>} />
            </Routes>
        </MemoryRouter>
    );
};

describe('AdminScopeGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('redirects unauthenticated users to login', async () => {
        useAuthStore.mockReturnValue({
            user: null,
            isAuthenticated: false,
            role: null,
            adminAccess: null,
            refreshAdminAccess: vi.fn(),
        });

        renderGuard(['messages.read']);
        expect(await screen.findByText('Login Page')).toBeInTheDocument();
    });

    it('blocks admin users missing one of required scopes', async () => {
        useAuthStore.mockReturnValue({
            user: { uid: 'a1' },
            isAuthenticated: true,
            role: 'admin',
            adminAccess: {
                adminType: 'ops_admin',
                scopes: ['payments.read'],
                isActive: true,
            },
            refreshAdminAccess: vi.fn(),
        });

        renderGuard(['payments.read', 'escrow.read']);
        expect(await screen.findByText('Scope Restricted')).toBeInTheDocument();
    });

    it('allows admin users with all required scopes', async () => {
        useAuthStore.mockReturnValue({
            user: { uid: 'a2' },
            isAuthenticated: true,
            role: 'admin',
            adminAccess: {
                adminType: 'ops_admin',
                scopes: ['payments.read', 'escrow.read'],
                isActive: true,
            },
            refreshAdminAccess: vi.fn(),
        });

        renderGuard(['payments.read', 'escrow.read']);
        expect(await screen.findByText('Scoped Admin Content')).toBeInTheDocument();
    });
});
