// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';

let adminApp: App | null = null;

function getAdminApp(): App | null {
    if (adminApp) {
        return adminApp;
    }

    if (getApps().length > 0) {
        adminApp = getApps()[0];
        return adminApp;
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        console.warn("Firebase Admin SDK environment variables are not set. Admin features will be disabled.");
        return null;
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        adminApp = initializeApp({
            credential: cert(serviceAccount),
        });
        return adminApp;
    } catch (e: any) {
        console.warn('Firebase Admin SDK initialization error:', e.message, 'Admin features will be disabled.');
        return null;
    }
}

const app = getAdminApp();

export const auth = app ? admin.auth(app) : null;
export const firestore = app ? admin.firestore(app) : null;
