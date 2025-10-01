// src/components/providers.tsx
"use client";

import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from './ui/sidebar';
import { FirebaseProvider } from '@/firebase/provider';


export function Providers({ children }: { children: React.ReactNode }) {

  return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <FirebaseProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </FirebaseProvider>
        <Toaster />
        <Analytics />
      </ThemeProvider>
  );
}
