
// src/firebase/client-provider.tsx
'use client';

import { useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { FirebaseProvider } from './provider';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
}

// State to track if persistence has been enabled
let persistenceEnabled = false;

export function FirebaseClientProvider({
  children,
  firebaseApp,
}: FirebaseClientProviderProps) {
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    // This effect runs only on the client
    const dbInstance = getFirestore(firebaseApp);
    
    if (!persistenceEnabled) {
      try {
        // Enable offline persistence. This must be done before any other
        // Firestore operations. The try-catch handles the error that occurs
        // on hot-reloads in development when it tries to re-enable it.
        enableIndexedDbPersistence(dbInstance);
        persistenceEnabled = true;
      } catch (error: any) {
        if (error.code !== 'failed-precondition') {
          console.error("Firebase persistence error:", error);
        }
      }
    }
    
    setDb(dbInstance);
    setAuth(getAuth(firebaseApp));
  }, [firebaseApp]);

  if (!db || !auth) {
    // You can return a loading spinner here if you want
    return null; 
  }

  return (
    <FirebaseProvider app={firebaseApp} auth={auth} db={db}>
      {children}
    </FirebaseProvider>
  );
}
