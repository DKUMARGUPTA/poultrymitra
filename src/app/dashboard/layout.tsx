// src/app/dashboard/layout.tsx
"use client";

import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { userProfile } = useAuth();
    
    return (
        <div className={cn(userProfile?.isPremium && 'theme-gold')}>
            {children}
        </div>
    )
}
