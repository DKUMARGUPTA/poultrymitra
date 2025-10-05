
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bird, PlusCircle } from "lucide-react"
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
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Skeleton } from '@/components/ui/skeleton';
import { BatchDetails } from '@/components/batch-details';
import { getBatchesByFarmer, Batch } from '@/services/batches.service';
import { AddBatchModal } from '@/components/add-batch-modal';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirebase } from '@/firebase';

export default function BatchesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useUser();
  const { db } = useFirebase();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);

  useEffect(() => {
    async function fetchBatches() {
      if (user && db) {
        setBatchesLoading(true);
        const userBatches = await getBatchesByFarmer(db, user.uid);
        setBatches(userBatches);
        setBatchesLoading(false);
      }
    }
    if(!authLoading){
        if(user){
            fetchBatches();
        } else {
            router.push('/auth');
        }
    }
  }, [user, authLoading, router, db]);

  const handleBatchAdded = (newBatch: Batch) => {
    setBatches(prevBatches => [newBatch, ...prevBatches]);
  };

  const handleBatchDeleted = (batchId: string) => {
    setBatches(prev => prev.filter(b => b.id !== batchId));
  };
  
  const handleBatchUpdated = (updatedBatch: Batch) => {
    setBatches(prev => prev.map(b => b.id === updatedBatch.id ? updatedBatch : b));
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
  
  const isLoading = authLoading || batchesLoading;

  if (isLoading || !user || !userProfile) {
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
                    <Skeleton className="h-32 w-full" />
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
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold md:text-2xl font-headline">My Batches</h1>
              <AddBatchModal onBatchAdded={handleBatchAdded} onNewBatchClick={handleNewBatchClick}>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Batch
                </Button>
              </AddBatchModal>
            </div>
             {batchesLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-7 w-2/3" />
                        <Skeleton className="h-4 w-1/3" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-24 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
            ) : batches.length === 0 ? (
                 <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[400px]">
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h3 className="text-2xl font-bold tracking-tight">No active batches</h3>
                        <p className="text-sm text-muted-foreground">Start by creating your first poultry batch.</p>
                        <AddBatchModal onBatchAdded={handleBatchAdded} onNewBatchClick={handleNewBatchClick}>
                            <Button className="mt-4">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Batch
                            </Button>
                        </AddBatchModal>
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 flex-col gap-4">
                    {batches.map(batch => (
                        <BatchDetails 
                            key={batch.id} 
                            batch={batch} 
                            onBatchDeleted={handleBatchDeleted}
                            onBatchUpdated={handleBatchUpdated}
                        />
                    ))}
                </div>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
