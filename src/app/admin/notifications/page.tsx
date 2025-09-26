// src/app/admin/notifications/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Bird, Megaphone } from "lucide-react"
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
import { UserProfile } from '@/services/users.service';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createAnnouncement } from '@/services/notifications.service';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';


const AnnouncementSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
  link: z.string().url().optional().or(z.literal('')),
});

type AnnouncementFormValues = z.infer<typeof AnnouncementSchema>;


export default function AdminNotificationsPage() {
  useAdminAuth();
  const { userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(AnnouncementSchema),
    defaultValues: { title: '', message: '', link: '' },
  });

  const onSubmit = async (values: AnnouncementFormValues) => {
    setIsSending(true);
    try {
        await createAnnouncement(values.title, values.message, values.link || undefined);
        toast({
            title: "Announcement Sent!",
            description: "Your announcement has been sent to all users.",
        });
        form.reset();
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Failed to Send",
            description: error.message || "An unexpected error occurred."
        })
    } finally {
        setIsSending(false);
    }
  }
  

  if (loading || !userProfile) {
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
                <h1 className="text-lg font-semibold md:text-2xl font-headline flex items-center gap-2">
                    <Megaphone />
                    Send Announcement
                </h1>
            </div>
             <Card className="flex-1">
                <CardHeader>
                    <CardTitle className="font-headline">Broadcast a Message</CardTitle>
                    <CardDescription>Send a notification to all registered users on the platform. Use this for new features or important updates.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                             <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., New Feature Alert!" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Message</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe the announcement in detail..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="link"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Optional Link</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., https://poultrymitra.com/blog/new-feature" {...field} />
                                    </FormControl>
                                    <FormDescription>If provided, users can click the notification to go to this URL.</FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSending}>
                                {isSending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                {isSending ? "Sending..." : "Send to All Users"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
