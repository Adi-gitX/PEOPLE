import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { onAuthChange, logout as firebaseLogout, getIdToken } from '../lib/auth';
import { api } from '../lib/api';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: true,
            role: null,

            initialize: () => {
                onAuthChange(async (firebaseUser) => {
                    if (firebaseUser) {
                        try {
                            const response = await api.get('/api/v1/users/me');

                            set({
                                user: {
                                    uid: firebaseUser.uid,
                                    email: firebaseUser.email,
                                    displayName: firebaseUser.displayName,
                                    photoURL: firebaseUser.photoURL,
                                },
                                profile: response.data?.profile || null,
                                isAuthenticated: true,
                                isLoading: false,
                                role: response.data?.user?.primaryRole || null,
                            });
                        } catch (error) {
                            // If profile fetch fails (e.g., 404), try to auto-register the user
                            // This handles cases where Firebase auth succeeded but backend creation failed
                            console.warn("User profile not found, attempting auto-registration...", error);

                            try {
                                const registerResponse = await api.post('/api/v1/users/register', {
                                    email: firebaseUser.email,
                                    fullName: firebaseUser.displayName || 'User',
                                    role: 'contributor', // Default fallback role
                                });

                                set({
                                    user: {
                                        uid: firebaseUser.uid,
                                        email: firebaseUser.email,
                                        displayName: firebaseUser.displayName,
                                        photoURL: firebaseUser.photoURL,
                                    },
                                    profile: registerResponse.profile || null,
                                    isAuthenticated: true,
                                    isLoading: false,
                                    role: registerResponse.user?.primaryRole || 'contributor',
                                });
                                console.log("Auto-registration successful");
                            } catch (regError) {
                                console.error("Auto-registration failed:", regError);
                                set({
                                    user: {
                                        uid: firebaseUser.uid,
                                        email: firebaseUser.email,
                                        displayName: firebaseUser.displayName,
                                        photoURL: firebaseUser.photoURL,
                                    },
                                    profile: null,
                                    isAuthenticated: true,
                                    isLoading: false,
                                    role: null,
                                });
                            }
                        }
                    } else {
                        set({
                            user: null,
                            profile: null,
                            isAuthenticated: false,
                            isLoading: false,
                            role: null,
                        });
                    }
                });
            },

            login: (userData, profileData) => {
                set({
                    user: userData,
                    profile: profileData,
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
                        isAuthenticated: false,
                        isLoading: false,
                        role: null,
                    });
                } catch (error) {
                    console.error('Logout error:', error);
                }
            },

            setRole: (role) => {
                set({ role });
            },

            setProfile: (profile) => {
                set({ profile });
            },

            refreshProfile: async () => {
                try {
                    const response = await api.get('/api/v1/users/me');
                    set({
                        profile: response.data?.profile || null,
                        role: response.data?.user?.primaryRole || null,
                    });
                } catch (error) {
                    console.error('Refresh profile error:', error);
                }
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
