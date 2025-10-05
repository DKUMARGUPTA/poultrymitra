// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "studio-3437887095-bb50a",
  appId: "1:956762008755:web:21a19533e89632fe0954c6",
  storageBucket: "studio-3437887095-bb50a.firebasestorage.app",
  apiKey: "AIzaSyC2wuz9oEpAny7yq_StkQykZ_AAq8HcATI",
  authDomain: "studio-3437887095-bb50a.firebaseapp.com",
  messagingSenderId: "956762008755",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined') {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

// These functions are for server-side usage, ensuring we don't re-initialize.
function getClientApp() {
    if (getApps().length === 0) {
        return initializeApp(firebaseConfig);
    }
    return getApp();
}

function getClientAuth() {
    return getAuth(getClientApp());
}

function getClientFirestore() {
    return getFirestore(getClientApp());
}

export { app, auth, db, getClientApp, getClientAuth, getClientFirestore };
