// src/app/admin/offers/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Bird, TicketPercent, PlusCircle } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionOffer, getActiveOffers } from '@/services/offers.service';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CreateOfferModal } from '@/components/create-offer-modal';
import { ThemeToggle } from '@/components/theme-toggle';
import { useFirestore } from '@/firebase/provider';

export default function AdminOffersPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const db = useFirestore();
  const [offers, setOffers] = useState<SubscriptionOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [userProfile, router]);
  
  useEffect(() => {
    if(userProfile?.role === 'admin') {
      fetchOffers();
    }
  }, [userProfile]);

  const fetchOffers = async () => {
    setLoading(true);
    const activeOffers = await getActiveOffers(db);
    setOffers(activeOffers);
    setLoading(false);
  }

  const handleOfferCreated = (newOffer: SubscriptionOffer) => {
    setOffers(prev => [newOffer, ...prev]);
  }

  if (!userProfile) {
    return (
       <div className="flex flex-col h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6"><Skeleton className="h-8 w-32" /><div className="w-full flex-1" /><Skeleton className="h-9 w-9 rounded-full" /></header>
        <div className="flex flex-1">
            <aside className="hidden md:flex flex-col w-64 border-r p-4 gap-4"><Skeleton className="h-8 w-40 mb-4" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></aside>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6"><Skeleton className="h-8 w-48" /><div className="flex-1 rounded-lg border border-dashed shadow-sm p-6"><Skeleton className="h-64 w-full" /></div></main>
        </div>
    </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4"><div className="flex items-center gap-2"><Bird className="w-8 h-8 text-primary" /><h1 className="text-2xl font-headline text-primary">Poultry Mitra</h1></div></SidebarHeader>
        <SidebarContent><MainNav /></SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6"><SidebarTrigger className="md:hidden" /><div className="w-full flex-1" /><UserNav /></header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl font-headline flex items-center gap-2">
                    <TicketPercent />
                    Subscription Offers
                </h1>
                <CreateOfferModal onOfferCreated={handleOfferCreated}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> New Offer
                    </Button>
                </CreateOfferModal>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Active Offers</CardTitle>
                    <CardDescription>Manage promotional codes for premium subscriptions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                        </div>
                    ) : offers.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center gap-2">
                            <p className="text-muted-foreground">No active offers.</p>
                            <CreateOfferModal onOfferCreated={handleOfferCreated}>
                                <Button variant="secondary">Create First Offer</Button>
                            </CreateOfferModal>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {offers.map((offer) => (
                               <Card key={offer.id} className="bg-muted/50">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="font-mono text-primary">{offer.code}</CardTitle>
                                        <div className="text-2xl font-bold">{offer.discountPercentage}% OFF</div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Expires on: {format(offer.expiresAt.toDate(), 'PPP')}</p>
                                    {/* Add edit/deactivate functionality later */}
                                </CardContent>
                               </Card>
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
