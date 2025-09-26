// src/components/providers.tsx
"use client";

import React from 'react';
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import { app } from '@/lib/firebase';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SidebarProvider } from './ui/sidebar';


export function Providers({ children }: { children: React.ReactNode }) {

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <FirebaseClientProvider firebaseApp={app}>
          <SidebarProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
          </SidebarProvider>
        </FirebaseClientProvider>
        <Toaster />
        <Analytics />
    </ThemeProvider>
  );
}
