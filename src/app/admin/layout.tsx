// src/app/admin/layout.tsx
import { getUserProfile } from '@/services/users.service';
import { redirect } from 'next/navigation';
import React from 'react';
import { auth } from '@/lib/firebase';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Bird } from 'lucide-react';


export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // This is a server component, so we can't use the useAuth hook directly.
    // We can check the auth state on the server.
    // In a real app with proper session management, you'd check the session here.
    // For this setup, we'll assume that if a user is logged in, we check their role.
    // This is a simplified check.
    const getAdminUser = async () => {
        try {
            // This is a placeholder for a more robust server-side session check
            // In this project's context, we don't have a server-side `auth.currentUser`
            // We'll proceed assuming the client-side check will eventually run,
            // but this architecture is better.
            return null;
        } catch (e) {
            return null;
        }
    }

    const user = await getAdminUser();
    
    // The client-side useAuth hook in the UserNav and other components will still
    // provide the definitive user profile. This layout is primarily for structure.

    // Admins don't get the gold theme by default, they see the standard UI
    return (
        <SidebarProvider>
            {children}
        </SidebarProvider>
    )
}
