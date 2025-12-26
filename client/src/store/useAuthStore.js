import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    role: null, // 'initiator' | 'contributor'
    isLoading: false,
    login: (userData) => set({ user: userData, isAuthenticated: true, role: userData.role }),
    logout: () => set({ user: null, isAuthenticated: false, role: null }),
    setRole: (role) => set({ role }),
}));
