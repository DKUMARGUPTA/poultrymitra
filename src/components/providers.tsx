// src/components/providers.tsx
"use client";

import React from 'react';
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from './ui/tooltip';


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
            {children}
        </TooltipProvider>
        <Analytics />
    </ThemeProvider>
  );
}
