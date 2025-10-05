

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Farmer, getFarmersByDealer } from '@/services/farmers.service';
import { AddConnectFarmerModal } from '@/components/add-connect-farmer-modal';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, getUserProfile } from '@/services/users.service';
import { useUser, useFirebase } from '@/firebase';


export function MyFarmers() {
  const { user, userProfile } = useUser();
  const { db } = useFirebase();
  const { toast } = useToast();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(true);

  useEffect(() => {
    if (user && db) {
      setFarmersLoading(true);
      const unsubscribe = getFarmersByDealer(db, user.uid, (newFarmers) => {
        setFarmers(newFarmers);
        setFarmersLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user, db]);

  const handleFarmerAction = (newFarmer: Farmer) => {
    // Listener will handle update
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
  
  const isLoading = farmersLoading;

  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline">My Farmers</CardTitle>
                <CardDescription>An overview of farmers in your network.</CardDescription>
            </div>
             <AddConnectFarmerModal onFarmerAction={handleFarmerAction} onNewFarmerClick={handleNewFarmerClick}>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add / Connect
                </Button>
              </AddConnectFarmerModal>
        </CardHeader>
        <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className='flex-1 space-y-2'>
                        <Skeleton className="h-4 w-24" />
                         <Skeleton className="h-3 w-16" />
                      </div>
                       <Skeleton className="h-5 w-20" />
                    </div>
                ))}
              </div>
            ) : farmers.length === 0 ? (
                 <div className="flex flex-col items-center justify-center text-center py-8">
                    <p className="text-sm text-muted-foreground">No farmers yet.</p>
                    <AddConnectFarmerModal onFarmerAction={handleFarmerAction} onNewFarmerClick={handleNewFarmerClick}>
                        <Button variant="secondary" className="mt-2">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Your First Farmer
                        </Button>
                    </AddConnectFarmerModal>
                </div>
            ) : (
              <div className="space-y-2">
                {farmers.map((farmer, index) => (
                    <Link href={`/farmers/${farmer.id}`} key={farmer.id} className="block rounded-lg hover:bg-muted/50 p-2">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={`https://picsum.photos/seed/farmer${index+1}/100`} data-ai-hint="person portrait" />
                                <AvatarFallback>{farmer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className='font-medium'>{farmer.name}</p>
                                <p className='text-xs text-muted-foreground'>{farmer.location}</p>
                            </div>
                            <Badge variant={farmer.outstanding > 0 ? 'destructive' : 'secondary'} className={farmer.outstanding <= 0 ? 'text-green-700 border-green-500/50' : ''}>
                                ₹{farmer.outstanding.toLocaleString()}
                            </Badge>
                        </div>
                   </Link>
                ))}
              </div>
            )}
        </CardContent>
    </Card>
  )
}
