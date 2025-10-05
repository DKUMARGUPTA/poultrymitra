// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// This object is sensitive and should not be hardcoded in a real-world scenario.
// It's included here for the simplicity of this example.
const firebaseConfig = {
  projectId: "studio-3437887095-bb50a",
  appId: "1:956762008755:web:21a19533e89632fe0954c6",
  storageBucket: "studio-3437887095-bb50a.firebasestorage.app",
  apiKey: "AIzaSyC2wuz9oEpAny7yq_StkQykZ_AAq8HcATI",
  authDomain: "studio-3437887095-bb50a.firebaseapp.com",
  messagingSenderId: "956762008755",
};


// These functions are for server-side usage (e.g., in Route Handlers or Server Actions)
// ensuring we don't re-initialize the app on every server-side execution.
function getClientApp() {
    if (getApps().length === 0) {
        return initializeApp(firebaseConfig);
    }
    return getApp();
}

export function getClientAuth() {
    return getAuth(getClientApp());
}

export function getClientFirestore() {
    return getFirestore(getClientApp());
}

// For client-side code, we will rely on the FirebaseClientProvider.
// This simplifies the logic here. We export the types for convenience.
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This block ensures that Firebase is only initialized on the client-side.
if (typeof window !== 'undefined') {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

// @ts-ignore - app, auth, db will be initialized on the client.
export { app, auth, db };
