// src/app/dashboard/layout.tsx
"use client";

import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, UserProfile } from '@/services/users.service';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const profile = await getUserProfile(currentUser.uid);
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
        });
        return () => unsubscribe();
    }, []);
    
    return (
        <div className={cn(userProfile?.isPremium && 'theme-gold')}>
            {children}
        </div>
    )
}
