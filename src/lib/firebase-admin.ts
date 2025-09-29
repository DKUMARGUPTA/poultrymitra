// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app';

function getAdminApp() {
    const appName = 'firebase-admin-app';
    const apps = getApps();
    const existingApp = apps.find(app => app.name === appName);

    if (existingApp) {
        return existingApp;
    }

    // Ensure you have these in your .env.local file or environment variables
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        try {
            return initializeApp({
                credential: cert(serviceAccount),
            }, appName);
        } catch (e: any) {
            console.error('Firebase Admin SDK initialization error:', e.stack);
            // Return a dummy object or throw an error to prevent further execution
            // For safety, we'll prevent the app from continuing without proper admin auth
            throw new Error("Could not initialize Firebase Admin SDK. Please check your configuration and environment variables.");
        }
    } else {
        console.warn('Firebase Admin environment variables are not set. Admin SDK not initialized.');
        throw new Error("Firebase Admin environment variables are not set.");
    }
}


const adminApp = getAdminApp();

export const auth = admin.auth(adminApp);
export const firestore = admin.firestore(adminApp);
