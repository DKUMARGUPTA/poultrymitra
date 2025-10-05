
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Bird, Building, ChevronRight } from "lucide-react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getUniquePurchaseSources } from '@/services/inventory.service';
import Link from 'next/link';

export default function SuppliersPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [sources, setSources] = useState<string[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth');
      } else if (userProfile?.role !== 'dealer') {
        router.push('/dashboard');
      } else {
        setSourcesLoading(true);
        getUniquePurchaseSources(user.uid).then(uniqueSources => {
          setSources(uniqueSources.sort());
          setSourcesLoading(false);
        });
      }
    }
  }, [user, userProfile, loading, router]);


  if (loading || !user || !userProfile) {
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
          <MainNav userProfile={userProfile} />
        </SidebarContent>
        <SidebarFooter>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1" />
            <UserNav />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold md:text-2xl font-headline">Suppliers</h1>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Your Suppliers</CardTitle>
                <CardDescription>
                  A list of companies you have purchased inventory from. Click one to view its ledger.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sourcesLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 border-b">
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ))}
                  </div>
                ) : sources.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No purchase sources found.</p>
                    <p className="text-sm text-muted-foreground">Add items to your inventory with a "Purchase Source" to see suppliers here.</p>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    {sources.map(source => (
                        <Link href={`/suppliers/${encodeURIComponent(source)}`} key={source} className="block hover:bg-muted/50">
                            <div className="flex items-center justify-between p-4 border-b last:border-b-0">
                                <div className="flex items-center gap-4">
                                    <Building className="w-5 h-5 text-muted-foreground" />
                                    <span className="font-medium">{source}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
