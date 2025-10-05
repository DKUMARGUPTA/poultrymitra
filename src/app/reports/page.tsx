// src/app/reports/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bird, BarChart } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BatchProfitabilityReport } from '@/components/reports/batch-profitability-report';
import { SalesReport } from '@/components/reports/sales-report';
import { useUser } from '@/firebase';

export default function ReportsPage() {
  const { user, userProfile, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
        if (!user) {
            router.push('/auth');
        } else if (userProfile?.role === 'admin') {
            router.push('/admin');
        }
    }
  }, [user, userProfile, loading, router]);
  
  const isLoading = loading || !userProfile;
  if (isLoading) {
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
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center gap-2">
                <BarChart className="w-6 h-6" />
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Reports & Analytics</h1>
            </div>
             <Tabs defaultValue={userProfile.role === 'dealer' ? 'sales' : 'profitability'} className="w-full">
                <TabsList>
                    {userProfile.role === 'farmer' && <TabsTrigger value="profitability">Batch Profitability</TabsTrigger>}
                    {userProfile.role === 'dealer' && <TabsTrigger value="sales">Sales Report</TabsTrigger>}
                </TabsList>
                {userProfile.role === 'farmer' && (
                    <TabsContent value="profitability">
                        <BatchProfitabilityReport />
                    </TabsContent>
                )}
                 {userProfile.role === 'dealer' && (
                    <TabsContent value="sales">
                        <SalesReport />
                    </TabsContent>
                )}
            </Tabs>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
