// src/components/providers.tsx
"use client";

import React from 'react';
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from './ui/sidebar';


export function Providers({ children }: { children: React.ReactNode }) {

  return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </AuthProvider>
        <Toaster />
        <Analytics />
      </ThemeProvider>
  );
}
