// src/app/orders/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bird, ShoppingCart } from "lucide-react";
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
import { OrderList } from '@/components/order-list';
import { Order } from '@/services/orders.service';
import { Button } from '@/components/ui/button';
import { AddTransactionModal } from '@/components/add-transaction-modal';
import { Transaction } from '@/services/transactions.service';
import { useUser } from '@/firebase';

export default function OrdersPage() {
  const { user, userProfile, loading } = useUser();
  const router = useRouter();
  
  useEffect(() => {
     if (!loading) {
        if (!user) {
            router.push('/auth');
        } else if (userProfile?.role === 'admin') {
            router.push('/admin');
        }
     }
  }, [user, userProfile, loading, router]);
  
  const handleTransactionAdded = (newTransaction: Transaction) => {
    // The transaction list on other pages will update automatically
  };

  const isLoading = loading || !userProfile;

  if (isLoading) {
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
              <h1 className="text-lg font-semibold md:text-2xl font-headline flex items-center gap-2">
                <ShoppingCart />
                {userProfile?.role === 'dealer' ? 'Manage Orders' : 'My Orders'}
              </h1>
              {userProfile?.role === 'farmer' && (
                <div className="flex gap-2">
                  <AddTransactionModal onTransactionAdded={handleTransactionAdded}>
                    <Button variant="outline">
                      Make Payment
                    </Button>
                  </AddTransactionModal>
                </div>
              )}
            </div>
            <OrderList />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
