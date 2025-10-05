// src/components/dealer-dashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { Users, Warehouse, IndianRupee, Activity, ArrowRight, DollarSign, Copy, Share2, PlusCircle, ShoppingCart, Bird, Bot, MessageCircle } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StatCard } from "@/components/stat-card";
import { OverviewChart } from "@/components/overview-chart";
import { TransactionHistory } from "./transaction-history";
import { Button } from "./ui/button";
import { getDealerDashboardStats, DealerStats } from "@/services/dashboard.service";
import { Skeleton } from "./ui/skeleton";
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserProfile, getUserProfile } from '@/services/users.service';
import { MarketRateDisplay } from "./market-rate-display";
import { AiFeatureCard } from "./ai/ai-feature-card";
import { MyFarmers } from "./my-farmers";
import { useToast } from "@/hooks/use-toast";
import { ConnectionRequests } from "./connection-requests";
import { Farmer } from "@/services/farmers.service";
import { AddConnectFarmerModal } from "./add-connect-farmer-modal";
import { CreateOrderModal } from "./create-order-modal";
import { Order } from "@/services/orders.service";
import { StockAdvisoryModal } from "./stock-advisory-modal";
import { WhatsappTemplatesModal } from "./whatsapp-templates-modal";


export function DealerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DealerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if(currentUser) {
            setUser(currentUser);
            const profile = await getUserProfile(currentUser.uid);
            setUserProfile(profile);
            
            getDealerDashboardStats(currentUser.uid).then(initialStats => {
                setStats(initialStats);
                setLoading(false);
            });
        }
    });

    return () => unsubscribe();
  }, []);
  
  const handleCopyCode = () => {
    if (userProfile?.invitationCode) {
        navigator.clipboard.writeText(userProfile.invitationCode);
        toast({ title: "Copied!", description: "Your invitation code has been copied to the clipboard."});
    }
  }

  const handleShareLink = async () => {
    if (userProfile?.invitationCode) {
        const url = `${window.location.origin}/auth?view=signup&dealerCode=${userProfile.invitationCode}`;
        const shareData = {
            title: 'Join me on Poultry Mitra!',
            text: `Use my invitation code to register as a farmer on Poultry Mitra.`,
            url: url,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                 console.log("Share failed:", err);
            }
        } else {
            navigator.clipboard.writeText(url);
            toast({ title: "Link Copied!", description: "A shareable registration link has been copied."});
        }
    }
  }

  const handleFarmerAction = async () => {
    if (user) {
        setStats(await getDealerDashboardStats(user.uid));
    }
  };
  
   const handleOrderCreated = async (newOrder: Order) => {
    if (user) {
        setStats(await getDealerDashboardStats(user.uid));
    }
  }
  
  const handleNewFarmerClick = () => {
    if (!userProfile?.isPremium && (stats?.totalFarmers ?? 0) >= 3) {
        toast({
            variant: "destructive",
            title: "Upgrade Required",
            description: "You have reached your limit of 3 farmers. Please upgrade to add more."
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
           <div className="grid gap-6 lg:grid-cols-3">
                <Skeleton className="h-64 w-full" />
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

  if (stats.totalFarmers === 0) {
      return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Welcome, {userProfile?.name}!</CardTitle>
                <CardDescription>Let's get your network set up by adding your first farmer.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[200px] p-8">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <Users className="h-12 w-12 text-primary" />
                        <h3 className="text-xl font-bold tracking-tight mt-4">Your network is ready</h3>
                        <p className="text-sm text-muted-foreground">Add farmers to manage their ledgers, track payments, and create orders.</p>
                        <AddConnectFarmerModal onFarmerAction={handleFarmerAction} onNewFarmerClick={handleNewFarmerClick}>
                            <Button className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Your First Farmer
                            </Button>
                        </AddConnectFarmerModal>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/farmers">
              <StatCard 
                title="Total Farmers"
                value={stats.totalFarmers.toString()}
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                description={!userProfile.isPremium ? 'Free plan limit: 3' : 'Your farmer network'}
              />
            </Link>
            <StatCard 
              title="Total Outstanding"
              value={`₹${stats.pendingPayments.toLocaleString()}`}
              icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />}
              description="Across all farmers"
            />
            <Link href="/inventory">
              <StatCard 
                title="Est. Stock Value"
                value={`₹${stats.stockValue.toLocaleString()}`}
                icon={<Warehouse className="h-4 w-4 text-muted-foreground" />}
                description="Cost price of current inventory"
              />
            </Link>
            <StatCard 
              title="Avg. Order Value"
              value={`₹${stats.avgOrderValue.toLocaleString()}`}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              description="From all farmers"
            />
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <ConnectionRequests />

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary"/>
                    Your Invitation Code
                </CardTitle>
                <CardDescription>Share this code or link with new farmers. They will need it to send you a connection request.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-muted rounded-md">
                    <p className="text-lg sm:text-2xl font-bold font-mono text-primary tracking-widest flex-1">{userProfile?.invitationCode}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={handleCopyCode}>
                          <Copy className="w-5 h-5"/>
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShareLink}>
                          <Share2 className="w-4 h-4 mr-2"/>
                          Share Link
                      </Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        {userProfile.isPremium ? (
          <MarketRateDisplay />
        ) : (
          <AiFeatureCard
            icon={<DollarSign />}
            title="Unlock Daily Market Rates"
            description="Upgrade to a Premium account to provide daily broiler rates to your farmers and make smarter business decisions."
            buttonText="Upgrade Now"
            isLocked
          />
        )}

      </div>

       <div className="grid gap-6 md:grid-cols-2">
            <MyFarmers />
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Recent Farmer Payments</CardTitle>
                    <CardDescription>You have {stats ? stats.recentTransactionsCount : '...'} payments this month.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TransactionHistory scope='dealer' />
                </CardContent>
            </Card>
        </div>


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Monthly Profit & Loss Overview</CardTitle>
            <CardDescription>A summary of your revenue vs. cost of goods sold.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart data={stats?.monthlyRevenue || []} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions</CardTitle>
            <CardDescription>Manage your network and sales.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
             <div className="grid grid-cols-2 gap-4">
                 <StockAdvisoryModal>
                    <AiFeatureCard 
                        icon={<Bot />}
                        title="AI Stock Advisory"
                        description="Get AI-driven advice for stock planning."
                        buttonText="Get Advice"
                        isLocked={!userProfile.isPremium}
                    />
                </StockAdvisoryModal>
                 <WhatsappTemplatesModal>
                    <AiFeatureCard 
                        icon={<MessageCircle />}
                        title="WhatsApp Templates"
                        description="AI-powered drafts for reminders and alerts."
                        buttonText="Create Draft"
                        isLocked={!userProfile.isPremium}
                    />
                </WhatsappTemplatesModal>
            </div>
             <CreateOrderModal onOrderCreated={handleOrderCreated}>
                <Button variant="secondary" className="w-full"><ShoppingCart className="mr-2 h-4 w-4"/> Create Order for Farmer</Button>
            </CreateOrderModal>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
