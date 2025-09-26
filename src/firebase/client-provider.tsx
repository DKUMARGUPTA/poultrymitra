// src/firebase/client-provider.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { FirebaseProvider } from './provider';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { app } from '@/lib/firebase';

let persistenceEnabled = false;

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // This effect runs only once on the client
    if (!persistenceEnabled) {
      try {
        const db = getFirestore(app);
        // Enable offline persistence. This must be done before any other
        // Firestore operations. The try-catch handles the error that occurs
        // on hot-reloads in development when it tries to re-enable it.
        enableIndexedDbPersistence(db);
        persistenceEnabled = true;
      } catch (error: any) {
        if (error.code !== 'failed-precondition') {
          console.error("Firebase persistence error:", error);
        }
      }
    }
    setInitialized(true);
  }, []);

  if (!initialized) {
    return null; // Or a loading spinner
  }

  return <FirebaseProvider>{children}</FirebaseProvider>;
}
