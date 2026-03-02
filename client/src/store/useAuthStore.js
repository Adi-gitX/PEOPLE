import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { onAuthChange, logout as firebaseLogout, getIdToken } from '../lib/auth';
import { api } from '../lib/api';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            profile: null,
            adminAccess: null,
            isAuthenticated: false,
            isLoading: true,
            role: null,
            authInitialized: false,

            initialize: () => {
                if (get().authInitialized) return;

                onAuthChange(async (firebaseUser) => {
                    if (firebaseUser) {
                        try {
                            await firebaseUser.getIdToken(true);
                            const response = await api.get('/api/v1/users/me');
                            const userData = response.data;
                            let adminAccess = null;
                            if (userData?.user?.primaryRole === 'admin') {
                                try {
                                    const adminResponse = await api.get('/api/v1/admin/me/scopes');
                                    adminAccess = adminResponse.data || null;
                                } catch {
                                    adminAccess = null;
                                }
                            }

                            set({
                                user: {
                                    uid: firebaseUser.uid,
                                    email: firebaseUser.email,
                                    displayName: userData?.user?.fullName || firebaseUser.displayName,
                                    photoURL: userData?.user?.avatarUrl || firebaseUser.photoURL,
                                },
                                profile: userData?.profile || null,
                                adminAccess,
                                isAuthenticated: true,
                                isLoading: false,
                                role: userData?.user?.primaryRole || null,
                                authInitialized: true,
                            });
                        } catch {
                            const storedRole = window.localStorage.getItem('signupRole') || 'contributor';
                            const storedName = window.localStorage.getItem('signupName') || firebaseUser.displayName || 'User';

                            try {
                                const registerResponse = await api.post('/api/v1/users/register', {
                                    email: firebaseUser.email,
                                    fullName: storedName,
                                    role: storedRole,
                                });

                                window.localStorage.removeItem('signupRole');
                                window.localStorage.removeItem('signupName');

                                set({
                                    user: {
                                        uid: firebaseUser.uid,
                                        email: firebaseUser.email,
                                        displayName: registerResponse.data?.user?.fullName || firebaseUser.displayName,
                                        photoURL: registerResponse.data?.user?.avatarUrl || firebaseUser.photoURL,
                                    },
                                    profile: registerResponse.data?.profile || null,
                                    adminAccess: null,
                                    isAuthenticated: true,
                                    isLoading: false,
                                    role: registerResponse.data?.user?.primaryRole || storedRole,
                                    authInitialized: true,
                                });
                            } catch {
                                set({
                                    user: {
                                        uid: firebaseUser.uid,
                                        email: firebaseUser.email,
                                        displayName: firebaseUser.displayName,
                                        photoURL: firebaseUser.photoURL,
                                    },
                                    profile: null,
                                    adminAccess: null,
                                    isAuthenticated: true,
                                    isLoading: false,
                                    role: null,
                                    authInitialized: true,
                                });
                            }
                        }
                    } else {
                        set({
                            user: null,
                            profile: null,
                            adminAccess: null,
                            isAuthenticated: false,
                            isLoading: false,
                            role: null,
                            authInitialized: true,
                        });
                    }
                });
            },

            setAuthState: (userData, profileData, userRole) => {
                set({
                    user: userData,
                    profile: profileData,
                    adminAccess: null,
                    isAuthenticated: true,
                    isLoading: false,
                    role: userRole,
                });
            },

            login: (userData, profileData) => {
                set({
                    user: userData,
                    profile: profileData,
                    adminAccess: null,
                    isAuthenticated: true,
                    isLoading: false,
                    role: profileData?.userId ? (get().role) : null,
                });
            },

            logout: async () => {
                try {
                    await firebaseLogout();
                    set({
                        user: null,
                        profile: null,
                        adminAccess: null,
                        isAuthenticated: false,
                        isLoading: false,
                        role: null,
                    });
                } catch {
                    // Silent fail
                }
            },

            setRole: (role) => {
                set({ role });
            },

            setProfile: (profile) => {
                set({ profile });
            },

            setAdminAccess: (adminAccess) => {
                set({ adminAccess });
            },

            refreshProfile: async () => {
                const response = await api.get('/api/v1/users/me');
                const userData = response.data;
                const currentUser = get().user;
                let adminAccess = get().adminAccess;
                if (userData?.user?.primaryRole === 'admin') {
                    try {
                        const adminResponse = await api.get('/api/v1/admin/me/scopes');
                        adminAccess = adminResponse.data || null;
                    } catch {
                        adminAccess = null;
                    }
                } else {
                    adminAccess = null;
                }
                set({
                    user: currentUser ? {
                        ...currentUser,
                        displayName: userData?.user?.fullName || currentUser.displayName,
                        photoURL: userData?.user?.avatarUrl || currentUser.photoURL,
                    } : currentUser,
                    profile: userData?.profile || null,
                    adminAccess,
                    role: userData?.user?.primaryRole || null,
                });
                return userData;
            },

            refreshAdminAccess: async () => {
                const response = await api.get('/api/v1/admin/me/scopes');
                const adminAccess = response.data || null;
                set({ adminAccess });
                return adminAccess;
            },

            getToken: async () => {
                return await getIdToken();
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                role: state.role,
            }),
        }
    )
);

export default useAuthStore;
