
"use client";

import { useEffect, useState } from 'react';
import { Bird, DollarSign, Activity, BarChart, ArrowRight, ShoppingCart, Briefcase, Clock, PlusCircle } from "lucide-react";
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
import { useAuth } from '@/hooks/use-auth';
import { getFarmerDashboardStats, FarmerStats } from '@/services/dashboard.service';
import { Skeleton } from './ui/skeleton';
import { getUserProfile, UserProfile } from '@/services/users.service';
import { MarketRateDisplay } from './market-rate-display';
import { AiFeatureCard } from './ai/ai-feature-card';
import { FarmerOverviewChart } from './farmer-overview-chart';
import { RequestOrderModal } from './request-order-modal';
import { Order } from '@/services/orders.service';
import { AddBatchModal } from './add-batch-modal';
import { Batch } from '@/services/batches.service';
import { useToast } from '@/hooks/use-toast';


export function FarmerDashboard() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<FarmerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dealerProfile, setDealerProfile] = useState<UserProfile | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    if (user) {
      if (userProfile?.dealerCode) {
        getUserProfile(userProfile.dealerCode).then(setDealerProfile);
      }

      const unsubStats = getFarmerDashboardStats(user.uid, (newStats) => {
        setStats(newStats);
        setBatches(prev => prev.length > newStats.activeBatches ? [] : prev); // crude way to refresh batches
        setLoading(false);
      });

      return () => { 
        unsubStats();
      };
    }
  }, [user, userProfile]);
  
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

  const isLoading = loading || !userProfile || !stats;

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
                            <Button className="mt-4" onClick={(e) => { if (!handleNewBatchClick()) e.preventDefault() }}>
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
              description="You are on the free plan (1 batch limit)"
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
         <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" />My Dealer</CardTitle>
            <CardDescription>Your main point of contact for supplies and payments.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {!userProfile ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ) : dealerProfile ? (
                <div className="space-y-4">
                    <div>
                        <p className="text-xl font-bold">{dealerProfile.name}</p>
                        <p className="text-sm text-muted-foreground">{dealerProfile.email}</p>
                    </div>
                     <RequestOrderModal onOrderCreated={handleOrderCreated}>
                        <Button>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Request New Order
                        </Button>
                    </RequestOrderModal>
                </div>
            ) : (
                <div className="text-center bg-yellow-50 border-yellow-200 border text-yellow-900 p-6 rounded-lg">
                    <div className="flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8 mr-2" />
                      <h3 className="text-xl font-bold font-headline">Connection Pending</h3>
                    </div>
                    <p className="text-sm">Your request to connect with a dealer is awaiting approval. Your dashboard will update once they accept.</p>
                </div>
            )}
          </CardContent>
        </Card>

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
          <TransactionHistory />
        </CardContent>
      </Card>
    </div>
  )
}
