// src/firebase/provider.tsx
'use client';

import { FirebaseApp } from 'firebase/app';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Firestore } from 'firebase/firestore';
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { UserProfile } from '@/services/users.service';

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

// Moved useUser hook here to colocate with its provider and context.
interface UserState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  auth: Auth | null;
}

export function useUser(): UserState {
  const { auth, db } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
            setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth, db]);

  return { user, userProfile, loading, auth };
}
