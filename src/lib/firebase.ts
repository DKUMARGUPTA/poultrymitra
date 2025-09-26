// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "studio-3437887095-bb50a",
  appId: "1:956762008755:web:21a19533e89632fe0954c6",
  storageBucket: "studio-3437887095-bb50a.firebasestorage.app",
  apiKey: "AIzaSyC2wuz9oEpAny7yq_StkQykZ_AAq8HcATI",
  authDomain: "studio-3437887095-bb50a.firebaseapp.com",
  messagingSenderId: "956762008755",
};

function initializeFirebase(): FirebaseApp {
    if (getApps().length === 0) {
        return initializeApp(firebaseConfig);
    } else {
        return getApp();
    }
}

export const app = initializeFirebase();
export const db = getFirestore(app);
export const auth = getAuth(app);
