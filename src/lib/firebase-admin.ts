// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';

let adminApp: App | null = null;

function getAdminApp() {
    if (adminApp) {
        return adminApp;
    }

    const appName = 'firebase-admin-app-' + process.env.NODE_ENV;
    const existingApp = getApps().find(app => app.name === appName);

    if (existingApp) {
        adminApp = existingApp;
        return adminApp;
    }

    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        try {
            adminApp = initializeApp({
                credential: cert(serviceAccount),
            }, appName);
            return adminApp;
        } catch (e: any) {
            console.error('Firebase Admin SDK initialization error. Check your environment variables.', e.stack);
            return null;
        }
    }
    
    console.warn('Firebase Admin environment variables are not set. Admin SDK features will be disabled.');
    return null;
}

const app = getAdminApp();

export const auth = app ? admin.auth(app) : null;
export const firestore = app ? admin.firestore(app) : null;
