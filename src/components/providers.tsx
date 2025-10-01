// src/components/providers.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from './ui/sidebar';
import { TooltipProvider } from './ui/tooltip';
import { AuthContext, AuthState } from '@/hooks/use-auth';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getUserProfile, UserProfile } from '@/services/users.service';

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userProfile: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        setAuthState({ user, userProfile: profile, loading: false });
      } else {
        setAuthState({ user: null, userProfile: null, loading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
       <AuthProvider>
        <TooltipProvider>
          <SidebarProvider>
              {children}
          </SidebarProvider>
        </TooltipProvider>
        <Toaster />
        <Analytics />
      </AuthProvider>
    </ThemeProvider>
  );
}
