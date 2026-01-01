import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebase';
import { api } from './api';

// ─── Auth Providers ───
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// ─── Email/Password Auth ───

/**
 * Sign up with email and password
 */
export const signUp = async (email, password, fullName, role = 'contributor') => {
    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name
    await updateProfile(userCredential.user, { displayName: fullName });

    // Register user in our database
    try {
        await api.post('/api/v1/users/register', {
            email,
            fullName,
            role,
        });
    } catch (error) {
        // If registration fails, delete the Firebase user
        await userCredential.user.delete();
        throw error;
    }

    return userCredential.user;
};

/**
 * Sign in with email and password
 */
export const signIn = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

// ─── OAuth Auth ───

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (role = 'contributor') => {
    const userCredential = await signInWithPopup(auth, googleProvider);

    // Check if this is a new user
    const isNewUser = userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime;

    if (isNewUser) {
        // Register in our database
        await api.post('/api/v1/users/register', {
            email: userCredential.user.email,
            fullName: userCredential.user.displayName || 'User',
            role,
        });
    }

    return userCredential.user;
};

/**
 * Sign in with GitHub
 */
export const signInWithGithub = async (role = 'contributor') => {
    const userCredential = await signInWithPopup(auth, githubProvider);

    // Check if this is a new user
    const isNewUser = userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime;

    if (isNewUser) {
        // Register in our database
        await api.post('/api/v1/users/register', {
            email: userCredential.user.email,
            fullName: userCredential.user.displayName || 'User',
            role,
        });
    }

    return userCredential.user;
};

// ─── Other Auth Actions ───

/**
 * Sign out
 */
export const logout = async () => {
    await signOut(auth);
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
    return auth.currentUser;
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

/**
 * Get current user's ID token
 */
export const getIdToken = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
};

export default {
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGithub,
    logout,
    resetPassword,
    getCurrentUser,
    onAuthChange,
    getIdToken,
};
