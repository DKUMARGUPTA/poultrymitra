// src/firebase/provider.tsx
'use client';

import React, { createContext, useContext } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase'; // Import the initialized app

interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({
  children,
  app: firebaseApp, // Rename to avoid conflict
  auth: firebaseAuth, // Rename to avoid conflict
  db: firestoreDb,   // Rename to avoid conflict
}: {
  children: React.ReactNode;
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}) {
  return (
    <FirebaseContext.Provider value={{ app: firebaseApp, auth: firebaseAuth, db: firestoreDb }}>
      {children}
    </FirebaseContext.Provider>
  );
}

// These hooks no longer need the context. They can directly use the singleton instances.
export const useFirebase = () => {
  return { app };
};

export const useFirestore = () => {
    return getFirestore(app);
}

export const useFirebaseAuth = () => {
    return getAuth(app);
}
