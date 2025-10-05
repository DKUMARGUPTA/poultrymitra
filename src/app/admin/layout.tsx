// src/app/admin/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Bird } from 'lucide-react';
import React from 'react';
import { auth as adminAuth } from '@/lib/firebase-admin';
import { getUserProfile, UserProfile } from '@/services/users.service';


// This is now a Server Component for robust auth checking
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const sessionCookie = cookies().get('session')?.value;
    let user: UserProfile | null = null;

    if (sessionCookie) {
        try {
            const decodedClaims = await adminAuth!.verifySessionCookie(sessionCookie, true);
            user = await getUserProfile(decodedClaims.uid);
        } catch (error) {
            console.error("Session verification failed:", error);
            user = null;
        }
    }

    if (!user || user.role !== 'admin') {
        redirect('/auth');
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
                <MainNav userProfile={user} />
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
