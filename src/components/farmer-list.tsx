

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Farmer, getFarmersByDealer, getAllFarmers } from '@/services/farmers.service';
import { UserProfile, getAllUsers } from '@/services/users.service';

type DealerWithStats = UserProfile & {
    farmerCount: number;
    totalOutstanding: number;
};

export function DealerList() {
  const [dealers, setDealers] = useState<DealerWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDealersAndStats = async () => {
      setLoading(true);
      const allUsers = await getAllUsers();
      const allFarmers = await getAllFarmers();
      
      const dealerUsers = allUsers.filter(u => u.role === 'dealer');

      const dealersWithStats = dealerUsers.map(dealer => {
        const farmersForDealer = allFarmers.filter(f => f.dealerId === dealer.uid);
        const totalOutstanding = farmersForDealer.reduce((acc, f) => acc + f.outstanding, 0);
        return {
          ...dealer,
          farmerCount: farmersForDealer.length,
          totalOutstanding,
        };
      });

      setDealers(dealersWithStats);
      setLoading(false);
    };
    fetchDealersAndStats();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">All Dealers</CardTitle>
        <CardDescription>A list of all dealers on the platform and their network stats.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className='flex-1 space-y-2'>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-20" />
                 <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : dealers.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <p className="text-sm text-muted-foreground">No dealers found on the platform yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dealers.map((dealer) => (
              <div key={dealer.uid} className="rounded-lg hover:bg-muted/50 p-2">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://picsum.photos/seed/${dealer.uid}/100`} data-ai-hint="person portrait" />
                    <AvatarFallback>{dealer.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className='font-medium'>{dealer.name}</p>
                    <p className='text-xs text-muted-foreground'>{dealer.email}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{dealer.farmerCount}</p>
                    <p className="text-xs text-muted-foreground">Farmers</p>
                  </div>
                   <div className="text-center">
                     <Badge variant={dealer.totalOutstanding > 0 ? 'destructive' : 'secondary'} className={dealer.totalOutstanding <= 0 ? 'text-green-700 border-green-500/50' : ''}>
                        ₹{dealer.totalOutstanding.toLocaleString()}
                    </Badge>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
