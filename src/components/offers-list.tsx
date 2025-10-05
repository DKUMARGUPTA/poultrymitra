// src/components/offers-list.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionOffer, getActiveOffers } from '@/services/offers.service';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CreateOfferModal } from '@/components/create-offer-modal';
import { TicketPercent, PlusCircle } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export function OffersList() {
    const [offers, setOffers] = useState<SubscriptionOffer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOffers() {
            setLoading(true);
            const initialOffers = await getActiveOffers();
            setOffers(initialOffers);
            setLoading(false);
        }
        fetchOffers();
    }, []);

    const handleOfferCreated = (newOffer: SubscriptionOffer) => {
        setOffers(prev => [newOffer, ...prev].sort((a,b) => b.createdAt.seconds - a.createdAt.seconds));
    }
    
    return (
        <>
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
                                </CardContent>
                               </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
             </Card>
        </>
    );
}
