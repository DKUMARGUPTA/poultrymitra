// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "studio-3437887095-bb50a",
  appId: "1:956762008755:web:21a19533e89632fe0954c6",
  storageBucket: "studio-3437887095-bb50a.firebasestorage.app",
  apiKey: "AIzaSyC2wuz9oEpAny7yq_StkQykZ_AAq8HcATI",
  authDomain: "studio-3437887095-bb50a.firebaseapp.com",
  messagingSenderId: "956762008755",
};

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence handling
let db;
if (typeof window !== 'undefined') {
  try {
    db = getFirestore(app);
    enableIndexedDbPersistence(db);
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
      // This error happens on hot-reloads in dev. It's safe to ignore.
      console.warn('Firestore persistence failed to enable. This is expected on hot reloads.');
      db = getFirestore(app);
    } else if (error.code === 'unimplemented') {
      // Some browsers may not support IndexedDB at all.
      console.warn('Firestore persistence not supported in this browser.');
      db = getFirestore(app);
    } else {
      console.error("Firebase persistence error:", error);
      db = getFirestore(app); // Fallback to memory persistence
    }
  }
} else {
  // For server-side rendering, just initialize Firestore without persistence
  db = getFirestore(app);
}

const auth = getAuth(app);

export { app, db, auth };
