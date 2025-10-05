// src/firebase/provider.tsx
'use client';

import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import React, { createContext, useContext, ReactNode } from 'react';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  db: null,
});

export const FirebaseProvider: React.FC<{
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  children: ReactNode;
}> = ({ app, auth, db, children }) => {
  return (
    <FirebaseContext.Provider value={{ app, auth, db }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  if (!context.app || !context.auth || !context.db) {
    throw new Error('Firebase not initialized correctly');
  }
  return context as Required<FirebaseContextType>;
};
