// src/firebase/client-provider.tsx
'use client';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import React, { ReactNode, useMemo } from 'react';
import { FirebaseProvider } from './provider';

const firebaseConfig = {
  projectId: "studio-3437887095-bb50a",
  appId: "1:956762008755:web:21a19533e89632fe0954c6",
  storageBucket: "studio-3437887095-bb50a.firebasestorage.app",
  apiKey: "AIzaSyC2wuz9oEpAny7yq_StkQykZ_AAq8HcATI",
  authDomain: "studio-3437887095-bb50a.firebaseapp.com",
  messagingSenderId: "956762008755",
};

export const FirebaseClientProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { app, auth, db } = useMemo(() => {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    return { app, auth, db };
  }, []);

  return (
    <FirebaseProvider app={app} auth={auth} db={db}>
      {children}
    </FirebaseProvider>
  );
};
