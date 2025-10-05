// src/app/farmers/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bird, PlusCircle, User, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Farmer, getFarmersByDealer } from '@/services/farmers.service';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, getUserProfile } from '@/services/users.service';
import { AddConnectFarmerModal } from '@/components/add-connect-farmer-modal';
import { useUser, useFirebase } from '@/firebase';

export default function FarmersPage() {
  const { user, userProfile, loading: authLoading } = useUser();
  const { db } = useFirebase();
  const router = useRouter();

  const { toast } = useToast();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (user && db) {
        if (userProfile?.role !== 'dealer') {
          router.push('/dashboard');
        } else {
          setFarmersLoading(true);
          const unsubscribe = getFarmersByDealer(db, user.uid, (newFarmers) => {
            setFarmers(newFarmers);
            setFarmersLoading(false);
          });
          return () => unsubscribe();
        }
      } else {
        router.push('/auth');
      }
    }
  }, [user, userProfile, authLoading, router, db]);
  
  const handleFarmerAction = async () => {
    // The listener will handle the update automatically.
  };
  
  const handleNewFarmerClick = () => {
    if (!userProfile?.isPremium && farmers.length >= 3) {
        toast({
            variant: "destructive",
            title: "Upgrade Required",
            description: "You have reached your limit of 3 farmers. Please upgrade to add more."
        });
        return false;
    }
    return true;
  };
  
  const isLoading = authLoading || farmersLoading;


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
              <h1 className="text-lg font-semibold md:text-2xl font-headline">My Farmers</h1>
                <AddConnectFarmerModal onFarmerAction={handleFarmerAction} onNewFarmerClick={handleNewFarmerClick}>
                    <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add / Connect Farmer
                    </Button>
                </AddConnectFarmerModal>
            </div>
            {farmersLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className='space-y-2'>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : farmers.length === 0 ? (
                 <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h3 className="text-2xl font-bold tracking-tight">No farmers yet</h3>
                        <p className="text-sm text-muted-foreground">Add a new farmer or connect with an existing one.</p>
                         <AddConnectFarmerModal onFarmerAction={handleFarmerAction} onNewFarmerClick={handleNewFarmerClick}>
                            <Button className="mt-4">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add / Connect Farmer
                            </Button>
                        </AddConnectFarmerModal>
                    </div>
                </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {farmers.map((farmer, index) => (
                  <Card key={farmer.id}>
                    <CardHeader className="flex flex-row items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://picsum.photos/seed/farmer${index+1}/100`} data-ai-hint="person portrait" />
                        <AvatarFallback>{farmer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className='font-headline text-xl'>{farmer.name}</CardTitle>
                        <CardDescription>{farmer.location}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Batch Size</span>
                        <span className="font-medium">{farmer.batchSize}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Outstanding</span>
                        <Badge variant={farmer.outstanding > 0 ? 'destructive' : 'secondary'} className={farmer.outstanding <= 0 ? 'text-green-700 border-green-500/50' : ''}>
                          ₹{farmer.outstanding.toLocaleString()}
                        </Badge>
                      </div>
                       <Button asChild className="w-full mt-4">
                        <Link href={`/farmers/${farmer.id}`}>View Ledger</Link>
                       </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
