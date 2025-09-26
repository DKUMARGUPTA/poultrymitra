// src/app/admin/layout.tsx
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { userProfile, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
           <div className="flex flex-col h-screen">
            <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
                <Skeleton className="h-8 w-32" />
                <div className="w-full flex-1" />
                <Skeleton className="h-9 w-9 rounded-full" />
            </header>
            <div className="flex flex-1">
                <aside className="hidden md:flex flex-col w-64 border-r p-4 gap-4">
                    <Skeleton className="h-8 w-40 mb-4" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </aside>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    <Skeleton className="h-8 w-48" />
                    <div className="flex-1 rounded-lg border border-dashed shadow-sm p-6">
                        <Skeleton className="h-64 w-full" />
                    </div>
                </main>
            </div>
        </div>
        )
    }

    if (userProfile?.role !== 'admin') {
        router.push('/dashboard');
        return null; // Return null to prevent rendering children while redirecting
    }
    
    // Admins don't get the gold theme by default, they see the standard UI
    return (
        <div>
            {children}
        </div>
    )
}
