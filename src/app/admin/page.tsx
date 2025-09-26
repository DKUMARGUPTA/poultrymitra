// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Bird, Shield, Users, TrendingUp, Briefcase, ArrowRight } from "lucide-react"
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
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserProfile, UserProfile } from '@/services/users.service';
import { getAdminDashboardStats, AdminStats } from '@/services/dashboard.service';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useFirestore } from '@/firebase/provider';


export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const db = useFirestore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);


  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else {
        getUserProfile(user.uid).then((profile) => {
          if (profile && profile.role !== 'admin') {
            router.push('/dashboard');
          } else {
            setUserProfile(profile);
            setProfileLoading(false);
          }
        });
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      getAdminDashboardStats(db).then(adminStats => {
        setStats(adminStats);
        setStatsLoading(false);
      });
    }
  }, [userProfile, db]);

  const isLoading = authLoading || profileLoading;
  
  const StatSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-16 mb-2" />
        <Skeleton className="h-3 w-full" />
      </CardContent>
    </Card>
  )

  if (isLoading || !userProfile) {
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
            <div className="flex items-center gap-2">
                <Shield className="w-6 h-6" />
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Admin Dashboard</h1>
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsLoading || !stats ? (
                <>
                    <StatSkeleton />
                    <StatSkeleton />
                    <StatSkeleton />
                    <StatSkeleton />
                </>
                ) : (
                <>
                    <StatCard 
                    title="Total Users"
                    value={stats.totalUsers.toString()}
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    description="All registered users"
                    />
                    <StatCard 
                    title="Total Farmers"
                    value={stats.totalFarmers.toString()}
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    description="Active farmer accounts"
                    />
                    <StatCard 
                    title="Total Dealers"
                    value={stats.totalDealers.toString()}
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    description="Active dealer accounts"
                    />
                    <StatCard 
                    title="Premium Users"
                    value={stats.premiumUsers.toString()}
                    icon={<Shield className="h-4 w-4 text-muted-foreground" />}
                    description="Users with premium access"
                    />
                </>
                )}
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Quick Actions</CardTitle>
                    <CardDescription>Quickly access core administrative functions.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                    <Card className="flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Users className="w-6 h-6 text-primary" />
                                <CardTitle className="font-headline">User Management</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>Grant or revoke premium access and manage user roles.</CardDescription>
                            <Button asChild className="mt-4">
                                <Link href="/users">Manage Users <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-6 h-6 text-primary" />
                                <CardTitle className="font-headline">Global Transactions</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>View a log of all transactions happening on the platform.</CardDescription>
                            <Button asChild className="mt-4">
                               <Link href="/transactions">View Log <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-primary" />
                                <CardTitle className="font-headline">Market Rates</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>Add and view daily broiler rates for different regions.</CardDescription>
                            <Button asChild className="mt-4">
                               <Link href="/market-rates">Manage Rates <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
