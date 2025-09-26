// src/firebase/provider.tsx
'use client';

import React from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase'; // Import the initialized app

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

// This provider is now simplified as it doesn't need to hold the instances.
// We keep it for structural consistency and potential future use.
export function FirebaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
