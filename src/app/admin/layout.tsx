// src/app/admin/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Bird } from 'lucide-react';
import React from 'react';
import { auth } from '@/lib/firebase-admin'; // Using admin auth
import { getUserProfile } from '@/services/users.service';

// This is now a Server Component
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    if (!auth) {
        console.warn("Firebase Admin SDK is not initialized. Admin features are disabled.");
        redirect('/auth');
    }

    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    let userProfile = null;
    if (sessionCookie) {
        try {
            const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
            userProfile = await getUserProfile(decodedToken.uid);
        } catch (error) {
            // Session cookie is invalid.
            console.error("Session cookie verification failed:", error);
            redirect('/auth');
        }
    } else {
        redirect('/auth');
    }

    if (!userProfile || userProfile.role !== 'admin') {
        redirect('/dashboard');
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
                <MainNav />
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
