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
            authInitialized: false,

            initialize: () => {
                if (get().authInitialized) return; // Prevent double initialization

                onAuthChange(async (firebaseUser) => {
                    console.log('[Auth] State changed:', firebaseUser?.email || 'No user');

                    if (firebaseUser) {
                        try {
                            // Get ID token first to ensure it's available for API calls
                            await firebaseUser.getIdToken(true);

                            const response = await api.get('/api/v1/users/me');
                            const userData = response.data;

                            console.log('[Auth] User profile loaded:', userData?.user?.primaryRole);

                            set({
                                user: {
                                    uid: firebaseUser.uid,
                                    email: firebaseUser.email,
                                    displayName: firebaseUser.displayName,
                                    photoURL: firebaseUser.photoURL,
                                },
                                profile: userData?.profile || null,
                                isAuthenticated: true,
                                isLoading: false,
                                role: userData?.user?.primaryRole || null,
                                authInitialized: true,
                            });
                        } catch (error) {
                            console.warn('[Auth] Profile not found, attempting auto-registration...', error.message);

                            // Check localStorage for signup info
                            const storedRole = window.localStorage.getItem('signupRole') || 'contributor';
                            const storedName = window.localStorage.getItem('signupName') || firebaseUser.displayName || 'User';

                            try {
                                const registerResponse = await api.post('/api/v1/users/register', {
                                    email: firebaseUser.email,
                                    fullName: storedName,
                                    role: storedRole,
                                });

                                console.log('[Auth] Auto-registration successful');

                                // Clean up localStorage
                                window.localStorage.removeItem('signupRole');
                                window.localStorage.removeItem('signupName');

                                set({
                                    user: {
                                        uid: firebaseUser.uid,
                                        email: firebaseUser.email,
                                        displayName: firebaseUser.displayName,
                                        photoURL: firebaseUser.photoURL,
                                    },
                                    profile: registerResponse.data?.profile || null,
                                    isAuthenticated: true,
                                    isLoading: false,
                                    role: registerResponse.data?.user?.primaryRole || storedRole,
                                    authInitialized: true,
                                });
                            } catch (regError) {
                                console.error('[Auth] Auto-registration failed:', regError);

                                // Still set authenticated but with no role
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
                                    authInitialized: true,
                                });
                            }
                        }
                    } else {
                        console.log('[Auth] User signed out');
                        set({
                            user: null,
                            profile: null,
                            isAuthenticated: false,
                            isLoading: false,
                            role: null,
                            authInitialized: true,
                        });
                    }
                });
            },

            // Called after successful login/signup to immediately update state
            setAuthState: (userData, profileData, userRole) => {
                console.log('[Auth] Setting auth state manually:', userRole);
                set({
                    user: userData,
                    profile: profileData,
                    isAuthenticated: true,
                    isLoading: false,
                    role: userRole,
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
                    console.error('[Auth] Logout error:', error);
                }
            },

            setRole: (role) => {
                console.log('[Auth] Setting role:', role);
                set({ role });
            },

            setProfile: (profile) => {
                set({ profile });
            },

            refreshProfile: async () => {
                try {
                    const response = await api.get('/api/v1/users/me');
                    const userData = response.data;
                    console.log('[Auth] Profile refreshed:', userData?.user?.primaryRole);
                    set({
                        profile: userData?.profile || null,
                        role: userData?.user?.primaryRole || null,
                    });
                    return userData;
                } catch (error) {
                    console.error('[Auth] Refresh profile error:', error);
                    throw error;
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
