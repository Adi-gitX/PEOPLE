import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { onAuthChange, logout as firebaseLogout, getIdToken } from '../lib/auth';
import { api, AUTH_SESSION_INVALID_EVENT, isAuthSessionError } from '../lib/api';

const AUTH_BOOTSTRAP_TIMEOUT_MS = 12000;
let sessionRecoveryListenerAttached = false;

const buildSignedOutState = () => ({
    user: null,
    profile: null,
    adminAccess: null,
    isAuthenticated: false,
    role: null,
    isLoading: false,
    authInitialized: true,
});

const sanitizePublicRole = (value) => (value === 'initiator' ? 'initiator' : 'contributor');
const resolveActiveRole = (payload, fallback = null) => (
    payload?.activeRole
    || payload?.user?.primaryRole
    || fallback
);

const buildUserFromFirebase = (firebaseUser, userData) => ({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: userData?.user?.fullName || firebaseUser.displayName,
    photoURL: userData?.user?.avatarUrl || firebaseUser.photoURL,
});

const handleSessionInvalidation = async (set) => {
    try {
        await firebaseLogout();
    } catch {
        // ignore logout failures during forced recovery
    } finally {
        set(buildSignedOutState());
    }
};

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

                if (!sessionRecoveryListenerAttached && typeof window !== 'undefined') {
                    const onSessionInvalid = async () => {
                        await handleSessionInvalidation(set);
                    };
                    window.addEventListener(AUTH_SESSION_INVALID_EVENT, onSessionInvalid);
                    sessionRecoveryListenerAttached = true;
                }

                onAuthChange(async (firebaseUser) => {
                    set({ isLoading: true });
                    const timeoutId = setTimeout(() => {
                        set((state) => (state.isLoading ? { ...state, isLoading: false, authInitialized: true } : state));
                    }, AUTH_BOOTSTRAP_TIMEOUT_MS);

                    const finalize = (payload) => {
                        clearTimeout(timeoutId);
                        set({
                            ...payload,
                            isLoading: false,
                            authInitialized: true,
                        });
                    };

                    if (!firebaseUser) {
                        finalize(buildSignedOutState());
                        return;
                    }

                    try {
                        await firebaseUser.getIdToken(true);

                        let userData;
                        try {
                            const response = await api.get('/api/v1/users/me');
                            userData = response.data;
                        } catch (error) {
                            if (error?.status !== 404) {
                                throw error;
                            }

                            const storedRole = sanitizePublicRole(
                                typeof window !== 'undefined'
                                    ? window.localStorage.getItem('signupRole') || 'contributor'
                                    : 'contributor'
                            );
                            const storedName = typeof window !== 'undefined'
                                ? window.localStorage.getItem('signupName') || firebaseUser.displayName || 'User'
                                : firebaseUser.displayName || 'User';
                            const registerResponse = await api.post('/api/v1/users/register', {
                                email: firebaseUser.email,
                                fullName: storedName,
                                role: storedRole,
                            });

                            if (typeof window !== 'undefined') {
                                window.localStorage.removeItem('signupRole');
                                window.localStorage.removeItem('signupName');
                            }
                            userData = registerResponse.data;
                        }

                        let adminAccess = null;
                        if (userData?.user?.primaryRole === 'admin') {
                            try {
                                const adminResponse = await api.get('/api/v1/admin/me/scopes');
                                adminAccess = adminResponse.data || null;
                            } catch (error) {
                                if (isAuthSessionError(error)) {
                                    throw error;
                                }
                                adminAccess = null;
                            }
                        }

                        finalize({
                            user: buildUserFromFirebase(firebaseUser, userData),
                            profile: userData?.profile || null,
                            adminAccess,
                            isAuthenticated: true,
                            role: resolveActiveRole(userData, null),
                        });
                    } catch (error) {
                        if (isAuthSessionError(error)) {
                            await handleSessionInvalidation(set);
                            clearTimeout(timeoutId);
                            return;
                        }

                        finalize({
                            user: {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName,
                                photoURL: firebaseUser.photoURL,
                            },
                            profile: null,
                            adminAccess: null,
                            isAuthenticated: true,
                            role: null,
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
                } finally {
                    set(buildSignedOutState());
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
                try {
                    const response = await api.get('/api/v1/users/me');
                    const userData = response.data;
                    const currentUser = get().user;
                    let adminAccess = get().adminAccess;
                    if (userData?.user?.primaryRole === 'admin') {
                        try {
                            const adminResponse = await api.get('/api/v1/admin/me/scopes');
                            adminAccess = adminResponse.data || null;
                        } catch (error) {
                            if (isAuthSessionError(error)) {
                                await handleSessionInvalidation(set);
                                throw error;
                            }
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
                        role: resolveActiveRole(userData, get().role),
                    });
                    return userData;
                } catch (error) {
                    if (isAuthSessionError(error)) {
                        await handleSessionInvalidation(set);
                    }
                    throw error;
                }
            },

            switchActiveRole: async (nextRole) => {
                try {
                    const response = await api.patch('/api/v1/users/me/active-role', { role: nextRole });
                    const payload = response.data;
                    const currentUser = get().user;

                    set({
                        user: currentUser ? {
                            ...currentUser,
                            displayName: payload?.user?.fullName || currentUser.displayName,
                            photoURL: payload?.user?.avatarUrl || currentUser.photoURL,
                        } : currentUser,
                        profile: payload?.profile || null,
                        role: resolveActiveRole(payload, nextRole),
                    });

                    return payload;
                } catch (error) {
                    if (isAuthSessionError(error)) {
                        await handleSessionInvalidation(set);
                    }
                    throw error;
                }
            },

            refreshAdminAccess: async () => {
                try {
                    const response = await api.get('/api/v1/admin/me/scopes');
                    const adminAccess = response.data || null;
                    set({ adminAccess });
                    return adminAccess;
                } catch (error) {
                    if (isAuthSessionError(error)) {
                        await handleSessionInvalidation(set);
                    }
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
