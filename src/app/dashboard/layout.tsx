// src/app/dashboard/layout.tsx
"use client";

import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { userProfile } = useUser();
    
    return (
        <div className={cn(userProfile?.isPremium && 'theme-gold')}>
            {children}
        </div>
    )
}
