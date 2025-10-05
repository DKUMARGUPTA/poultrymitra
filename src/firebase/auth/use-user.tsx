// src/firebase/auth/use-user.tsx
'use client';

import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useFirebase } from '../provider';
import { UserProfile } from '@/services/users.service';

interface UserState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  auth: any;
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

        // Return cleanup function for profile listener
        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Return cleanup function for auth listener
    return () => unsubscribeAuth();
  }, [auth, db]);

  return { user, userProfile, loading, auth };
}
