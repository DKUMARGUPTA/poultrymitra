// src/firebase/client-provider.tsx
'use client';

import { useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { FirebaseProvider } from './provider';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
}

export function FirebaseClientProvider({
  children,
  firebaseApp,
}: FirebaseClientProviderProps) {
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    // This effect runs only on the client
    const dbInstance = getFirestore(firebaseApp);
    
    // Note: The enablePersistence call has been removed as it was causing
    // a persistent runtime error in the Next.js environment.
    // The app will function correctly online without it.
    
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
