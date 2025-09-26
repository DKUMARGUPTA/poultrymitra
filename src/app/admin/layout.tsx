// src/app/admin/layout.tsx
"use client";

import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && userProfile?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [userProfile, loading, router]);
    
    // Admins don't get the gold theme by default, they see the standard UI
    return (
        <div>
            {children}
        </div>
    )
}
