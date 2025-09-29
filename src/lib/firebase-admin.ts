// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app';

// Ensure you have these in your .env.local file or environment variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const appName = 'firebase-admin-app';
const apps = getApps();
const existingApp = apps.find(app => app.name === appName);

if (!existingApp) {
  // Initialize the app if it doesn't already exist
  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
     try {
       initializeApp({
          credential: cert(serviceAccount),
       }, appName);
       console.log('Firebase Admin SDK initialized.');
     } catch (e: any) {
        console.error('Firebase Admin SDK initialization error:', e.stack);
     }
  } else {
    console.warn('Firebase Admin environment variables are not set. Admin SDK not initialized.');
  }
}

export const auth = existingApp ? admin.auth(existingApp) : admin.auth();
export const firestore = existingApp ? admin.firestore(existingApp) : admin.firestore();
