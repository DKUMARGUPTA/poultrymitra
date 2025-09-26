// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Shield, Users, TrendingUp, Briefcase, ArrowRight } from "lucide-react"
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminDashboardStats, AdminStats } from '@/services/dashboard.service';
import { StatCard } from '@/components/stat-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';


export default function AdminPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      getAdminDashboardStats().then(adminStats => {
        setStats(adminStats);
        setStatsLoading(false);
      });
    }
  }, [userProfile]);

  const isLoading = authLoading || !userProfile || statsLoading;
  
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

  if (isLoading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
            </div>
            <Skeleton className="h-64 w-full" />
        </main>
    )
  }
  
  if (!userProfile || !stats) return null;

  return (
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            <h1 className="text-lg font-semibold md:text-2xl font-headline">Admin Dashboard</h1>
        </div>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
  )
}
