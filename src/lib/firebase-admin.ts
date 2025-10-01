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

    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

        if (serviceAccount.project_id) {
            adminApp = initializeApp({
                credential: cert(serviceAccount),
            }, appName);
            return adminApp;
        }
    } catch (e: any) {
        console.warn('Firebase Admin SDK initialization error: Could not parse FIREBASE_SERVICE_ACCOUNT_KEY.', e.message);
    }
    
    console.warn('Firebase Admin environment variables are not set. Admin SDK features will be disabled.');
    return null;
}

const app = getAdminApp();

export const auth = app ? admin.auth(app) : null;
export const firestore = app ? admin.firestore(app) : null;
