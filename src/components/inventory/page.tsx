// src/app/inventory/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bird, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
} from "@/components/ui/sidebar";
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInventoryItems, InventoryItem } from '@/services/inventory.service';
import { AddStockModal } from '@/components/add-stock-modal';
import Link from 'next/link';
import { useUser, useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function InventoryPage() {
  const { user, userProfile, loading: authLoading } = useUser();
  const { db } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && db) {
        if (userProfile?.role !== 'dealer') {
            router.push('/dashboard');
        } else {
            fetchInventory(user.uid);
        }
    } else if (!authLoading && !user) {
        router.push('/auth');
    }
  }, [user, userProfile, authLoading, router, db]);

  const fetchInventory = async (uid: string) => {
      if (!db) return;
      setInventoryLoading(true);
      const unsubscribe = getInventoryItems(db, uid, (items) => {
          setInventoryItems(items.sort((a,b) => a.name.localeCompare(b.name)));
          setInventoryLoading(false);
      });
      return unsubscribe;
  }

  const handleStockAdded = (purchaseOrderId: string) => {
    if (user) {
        fetchInventory(user.uid);
    }
  };

  const isLoading = authLoading || !userProfile;
  if (isLoading) {
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
              <h1 className="text-lg font-semibold md:text-2xl font-headline">Inventory Management</h1>
              <AddStockModal onStockAdded={handleStockAdded}>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Purchase Order
                </Button>
              </AddStockModal>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Current Stock</CardTitle>
                <CardDescription>
                  Manage your feed, medicine, and vaccine inventory.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inventoryLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-8 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : inventoryItems.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No inventory items found.</p>
                     <AddStockModal onStockAdded={handleStockAdded}>
                      <Button className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add First Item
                      </Button>
                    </AddStockModal>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-muted-foreground">{item.purchaseSource || 'N/A'}</TableCell>
                          <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
