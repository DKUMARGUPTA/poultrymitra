

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Bird, TrendingUp, PlusCircle, Upload } from "lucide-react"
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
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserProfile, UserProfile } from '@/services/users.service';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AddMarketRateModal } from '@/components/add-market-rate-modal';
import { MarketRate } from '@/services/market-rates.service';
import { MarketRateDisplay } from '@/components/market-rate-display';
import { LandingPageHeader } from '@/components/landing-page-header';
import { BulkUploadMarketRatesModal } from '@/components/bulk-upload-market-rates-modal';
import { AnimatedLogo } from '@/components/animated-logo';


export default function MarketRatesPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleRatesAdded = () => {
    // The MarketRateDisplay component will update automatically via its own subscription
  };
  
  const canAddRates = userProfile?.role === 'admin' || (userProfile?.role === 'dealer' && (userProfile?.ratePermissions?.length ?? 0) > 0);

  if (authLoading) {
     return (
      <SidebarProvider>
       <div className="flex flex-col h-screen">
        <LandingPageHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 pt-24">
            <Skeleton className="h-8 w-48" />
            <div className="flex-1 rounded-lg border border-dashed shadow-sm p-6">
                <Skeleton className="h-64 w-full" />
            </div>
        </main>
    </div>
    </SidebarProvider>
    )
  }
  
  return (
    <SidebarProvider>
        {user && canAddRates ? (
            <>
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
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="font-headline text-xl flex items-center gap-2">
                                        <TrendingUp className="w-6 h-6 text-primary" />
                                        Market Rate Management
                                    </CardTitle>
                                    <CardDescription>Add and view the daily broiler rates for different regions.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <BulkUploadMarketRatesModal onRatesAdded={handleRatesAdded}>
                                        <Button variant="outline">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload
                                        </Button>
                                    </BulkUploadMarketRatesModal>
                                    <AddMarketRateModal onRateAdded={handleRatesAdded}>
                                        <Button>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add Market Rate
                                        </Button>
                                    </AddMarketRateModal>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <MarketRateDisplay />
                            </CardContent>
                        </Card>
                    </main>
                    </div>
                </SidebarInset>
            </>
        ) : (
            // Public View
            <div className="flex flex-col min-h-screen bg-background text-foreground">
              <LandingPageHeader />
              <main className="flex-1 pt-24">
                <div className="container mx-auto px-4 py-12">
                    <header className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter font-headline">Live Market Rates</h1>
                        <p className="max-w-2xl mx-auto text-muted-foreground md:text-xl mt-4">
                            The latest broiler chicken rates from various markets, updated daily.
                        </p>
                    </header>
                    <MarketRateDisplay />
                </div>
              </main>
              <footer className="bg-gray-900 text-white">
                <div className="container px-4 md:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <AnimatedLogo className="h-8 w-8 text-green-400" />
                            <span className="text-xl font-headline font-bold">Poultry Mitra</span>
                        </div>
                        <p className="text-sm text-gray-400">India's #1 Poultry Farm Management and Advisory company.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Quick Links</h4>
                        <nav className="flex flex-col gap-2 text-sm">
                            <Link href="/#features" className="text-gray-400 hover:text-white">Features</Link>
                            <Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link>
                            <Link href="/tools" className="text-gray-400 hover:text-white">Tools</Link>
                            <Link href="/market-rates" className="text-gray-400 hover:text-white">Market Rates</Link>
                        </nav>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Support</h4>
                        <nav className="flex flex-col gap-2 text-sm">
                            <Link href="#" className="text-gray-400 hover:text-white">Help</Link>
                            <Link href="#" className="text-gray-400 hover:text-white">Privacy Policy</Link>
                        </nav>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Contact</h4>
                        <div className="text-sm text-gray-400">
                            <p>+91 9123456789</p>
                            <p>help@poultrymitra.com</p>
                        </div>
                    </div>
                </div>
                <div className="py-6 border-t border-gray-800">
                    <p className="text-center text-xs text-gray-500">&copy; 2024 Poultry Mitra. All rights reserved.</p>
                </div>
              </footer>
            </div>
        )}
    </SidebarProvider>
  )
}
