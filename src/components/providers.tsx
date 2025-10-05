// src/components/providers.tsx
"use client";

import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from './ui/sidebar';
import { TooltipProvider } from './ui/tooltip';
import { AuthProvider } from '@/components/auth-provider';

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
