// src/app/ai-chat/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, UserProfile } from '@/services/users.service';
import { Bird, Bot } from "lucide-react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
} from "@/components/ui/sidebar"
import { Skeleton } from '@/components/ui/skeleton';
import { AiChat } from '@/components/ai-chat';
import { AiFeatureCard } from '@/components/ai/ai-feature-card';

export default function AiChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
      } else {
        router.push('/auth');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading || !user) {
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

  const isPremium = !!userProfile?.isPremium;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Bird className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-headline text-primary">Poultry Mitra</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <MainNav userProfile={userProfile}/>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1" />
            <UserNav />
          </header>
           <main className="flex-1 overflow-hidden">
                {!isPremium ? (
                <div className="h-full flex items-center justify-center p-4">
                    <div className="w-full max-w-md">
                        <AiFeatureCard 
                            icon={<Bot />}
                            title="Unlock AI Assistant"
                            description="Upgrade to a Premium account to chat with our AI assistant. Get instant answers about your farm's performance, batches, finances, and more."
                            buttonText="Upgrade to Chat with AI"
                            isLocked
                        />
                    </div>
                </div>
                ) : (
                    <AiChat user={user} />
                )}
           </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
