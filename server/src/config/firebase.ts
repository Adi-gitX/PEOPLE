import admin from 'firebase-admin';
import { env } from './env.js';

// Initialize Firebase Admin SDK
// Only initialize if not already initialized
if (!admin.apps.length) {
    // Check if we have full credentials
    if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: env.FIREBASE_PROJECT_ID,
                clientEmail: env.FIREBASE_CLIENT_EMAIL,
                privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
        });
        console.log('✅ Firebase Admin initialized with service account');
    } else {
        // Initialize with just project ID (limited functionality)
        admin.initializeApp({
            projectId: env.FIREBASE_PROJECT_ID,
        });
        console.log('⚠️  Firebase Admin initialized without service account (limited functionality)');
        console.log('   Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY for full features');
    }
}

// Export Firestore database instance
export const db = admin.firestore();

// Export Auth instance
export const auth = admin.auth();

// Export admin for advanced usage
export { admin };
