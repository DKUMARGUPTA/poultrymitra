// src/app/admin/layout.tsx
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Bird } from 'lucide-react';
import React, { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// This is now a Client Component to use the useAuth hook
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth');
            } else if (userProfile?.role !== 'admin') {
                router.push('/dashboard');
            }
        }
    }, [user, userProfile, loading, router]);


    if (loading || !userProfile || userProfile.role !== 'admin') {
         return (
            <div className="flex flex-col h-screen">
                <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6"><Skeleton className="h-8 w-32" /><div className="w-full flex-1" /><Skeleton className="h-9 w-9 rounded-full" /></header>
                <div className="flex flex-1">
                    <aside className="hidden md:flex flex-col w-64 border-r p-4 gap-4"><Skeleton className="h-8 w-40 mb-4" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></aside>
                    <main className="flex flex-1 items-center justify-center"><Skeleton className="h-64 w-full max-w-lg" /></main>
                </div>
            </div>
        );
    }
    

    return (
        <SidebarProvider>
             <Sidebar>
                <SidebarHeader className="p-4">
                <div className="flex items-center gap-2">
                    <Bird className="w-8 h-8 text-primary" /><h1 className="text-2xl font-headline text-primary">Poultry Mitra</h1>
                </div>
                </SidebarHeader>
                <SidebarContent>
                <MainNav userProfile={userProfile} />
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <div className="flex flex-col">
                    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
                        <SidebarTrigger className="md:hidden" />
                        <div className="w-full flex-1" />
                        <UserNav />
                    </header>
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
