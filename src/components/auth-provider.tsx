// src/components/auth-provider.tsx
'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/services/users.service';
import { AuthContext, AuthContextType } from '@/hooks/use-auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // If there's a user, subscribe to their profile document
        const profileDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            // Ensure status is set
            if (!profileData.status) {
              profileData.status = 'active';
            }
            if (profileData.status === 'suspended') {
              // If user is suspended, log them out client-side
              auth.signOut();
            } else {
              setUserProfile(profileData);
            }
          } else {
            // This can happen if the user exists in Auth but not in Firestore.
            // Log them out to prevent being in a broken state.
            setUserProfile(null);
            auth.signOut();
          }
          setLoading(false);
        });
      } else {
        // No user, reset states and finish loading
        setUserProfile(null);
        setLoading(false);
        // Unsubscribe from any previous profile listener
        if (unsubscribeProfile) {
          unsubscribeProfile();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const value: AuthContextType = { user, userProfile, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
