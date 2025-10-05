// src/components/farmer-dashboard.tsx

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bird, DollarSign, Activity, BarChart, ArrowRight, ShoppingCart, Briefcase, Clock, PlusCircle, Link as LinkIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StatCard } from "@/components/stat-card";
import { TransactionHistory } from "./transaction-history";
import Link from "next/link";
import { Button } from "./ui/button";
import { getFarmerDashboardStats, FarmerStats } from '@/services/dashboard.service';
import { Skeleton } from './ui/skeleton';
import { getUserProfile, UserProfile } from '@/services/users.service';
import { MarketRateDisplay } from './market-rate-display';
import { AiFeatureCard } from './ai/ai-feature-card';
import { FarmerOverviewChart } from './farmer-overview-chart';
import { CreateOrderModal } from './create-order-modal';
import { Order } from '@/services/orders.service';
import { AddBatchModal } from './add-batch-modal';
import { Batch, getBatchesByFarmer } from '@/services/batches.service';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirebase } from '@/firebase';
import { DealerInventory } from './dealer-inventory';


export function FarmerDashboard() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useUser();
  const { db } = useFirebase();
  const { toast } = useToast();
  const [stats, setStats] = useState<FarmerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dealerProfile, setDealerProfile] = useState<UserProfile | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    if (!user || !db) return;
    
    setLoading(true);

    if (userProfile?.dealerCode) {
        getUserProfile(userProfile.dealerCode).then(setDealerProfile);
    }
    
    getFarmerDashboardStats(db, user.uid).then(setStats);
    getBatchesByFarmer(db, user.uid).then(setBatches);

    setLoading(false);

  }, [user, userProfile, db]);
  
  const handleOrderCreated = (newOrder: Order) => {
    // Optionally, you can update some state here to reflect the new order
  }

  const handleBatchAdded = (newBatch: Batch) => {
    setBatches(prev => [...prev, newBatch]);
  };
  
  const handleNewBatchClick = () => {
    if (!userProfile?.isPremium && batches.length >= 1) {
        toast({
            variant: "destructive",
            title: "Upgrade Required",
            description: "You have reached your limit of 1 batch. Please upgrade to create more."
        });
        return false;
    }
    return true;
  };

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

  const isLoading = authLoading || loading || !userProfile || !stats;

  if (isLoading) {
     return (
       <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>
           <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
           </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
           </div>
       </div>
     )
  }
  
  if (!userProfile?.dealerCode) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Welcome, {userProfile?.name}!</CardTitle>
                <CardDescription>To get the most out of Poultry Mitra, connect with your dealer.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[200px] p-8">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <LinkIcon className="h-12 w-12 text-primary" />
                        <h3 className="text-xl font-bold tracking-tight mt-4">Connect with Your Dealer</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">Connect with your dealer to view their inventory, place orders, and manage your ledger seamlessly. Go to your settings to add your dealer's code.</p>
                        <Button className="mt-4" asChild>
                            <Link href="/settings">Go to Settings <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
  }

  if (stats.activeBatches === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Welcome, {userProfile?.name}!</CardTitle>
                <CardDescription>Get started by creating your first poultry batch.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[200px] p-8">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <Bird className="h-12 w-12 text-primary" />
                        <h3 className="text-xl font-bold tracking-tight mt-4">Your dashboard is ready</h3>
                        <p className="text-sm text-muted-foreground">Track mortality, feed consumption, and sales all in one place.</p>
                        <AddBatchModal onBatchAdded={handleBatchAdded} onNewBatchClick={handleNewBatchClick}>
                            <Button className="mt-4" onClick={(e) => { if (!handleNewBatchClick()) e.preventDefault(); }}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Your First Batch
                            </Button>
                        </AddBatchModal>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
  }


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Active Batches"
              value={stats.activeBatches.toString()}
              icon={<Bird className="h-4 w-4 text-muted-foreground" />}
              description={!userProfile.isPremium ? 'Free plan limit: 1' : 'Currently active batches'}
            />
            <StatCard 
              title="Avg. Mortality Rate"
              value={`${stats.avgMortalityRate.toFixed(1)}%`}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              description="Across all completed batches"
            />
            <StatCard 
              title="Avg. Weight"
              value={`${stats.avgWeight.toFixed(1)} Kg`}
              icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
              description="For the current active batch"
            />
            <StatCard 
              title="Outstanding Balance"
              value={`₹${stats.outstandingBalance.toLocaleString()}`}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              description="Amount due to your dealer"
            />
      </div>
      
       <div className="grid gap-6 md:grid-cols-2">
         <DealerInventory />

        {userProfile.isPremium ? (
          <MarketRateDisplay />
        ) : (
          <AiFeatureCard
            icon={<DollarSign />}
            title="Unlock Daily Market Rates"
            description="Upgrade to a Premium account to view daily broiler rates for your district and state. Make informed decisions to maximize your profit."
            buttonText="Upgrade Now"
            isLocked
          />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline">Batch Performance</CardTitle>
                <CardDescription>A comparison of your recent batches.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
               <FarmerOverviewChart />
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions</CardTitle>
            <CardDescription>Use AI-powered tools to manage your farm.</CardDescription>
          </CardHeader>
          <CardContent>
             <Link href="/ai-tools">
                <Button>Go to AI Tools <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Recent Transactions</CardTitle>
          <CardDescription>Recent payments made to your dealer.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionHistory scope="user"/>
        </CardContent>
      </Card>
    </div>
  )
}
