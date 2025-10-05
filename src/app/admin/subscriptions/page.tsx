// src/app/admin/subscriptions/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bird, Settings, Save, Loader } from "lucide-react"
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSubscriptionSettings, updateSubscriptionSettings, SubscriptionSettingsSchema, SubscriptionSettings } from '@/services/settings.service';
import { useUser } from '@/firebase';

export default function AdminSubscriptionsPage() {
  const { userProfile, loading: authLoading } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<SubscriptionSettings>({
    resolver: zodResolver(SubscriptionSettingsSchema),
    defaultValues: {
        farmerPlanPrice: 0,
        dealerPlanPrice: 0,
        upiId: '',
        upiName: '',
    }
  });

  useEffect(() => {
    if (userProfile?.role === 'admin') {
        getSubscriptionSettings().then(settings => {
            form.reset(settings);
            setLoading(false);
        });
    }
  }, [userProfile, form]);

  const onSubmit = async (values: SubscriptionSettings) => {
    setSaving(true);
    try {
        await updateSubscriptionSettings(values);
        toast({ title: "Settings Saved", description: "Subscription settings have been updated successfully." });
    } catch(e: any) {
        toast({ variant: "destructive", title: "Save Failed", description: e.message });
    } finally {
        setSaving(false);
    }
  };

  if (!userProfile || loading || authLoading) {
    return (
       <div className="flex flex-col h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6"><Skeleton className="h-8 w-32" /><div className="w-full flex-1" /><Skeleton className="h-9 w-9 rounded-full" /></header>
        <div className="flex flex-1">
            <aside className="hidden md:flex flex-col w-64 border-r p-4 gap-4"><Skeleton className="h-8 w-40 mb-4" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></aside>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6"><Skeleton className="h-96 w-full" /></main>
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
            <div className="flex items-center gap-2">
                <Settings className="w-6 h-6" />
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Subscription Settings</h1>
            </div>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan Pricing (per month)</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="farmerPlanPrice"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Farmer Premium Price (₹)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 125" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="dealerPlanPrice"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Dealer Premium Price (₹)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 499" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Payment Details</CardTitle>
                            <CardDescription>This information will be shown to users on the billing page.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="upiId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>UPI ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., your-vpa@okhdfcbank" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="upiName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>UPI Name (Recipient)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Poultry Mitra Inc" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                     <Button type="submit" disabled={saving}>
                        {saving ? <><Loader className="animate-spin mr-2"/> Saving...</> : <><Save className="mr-2 h-4 w-4"/>Save Settings</>}
                     </Button>
                </form>
             </Form>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
