
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Bird, MessageCircle, Paperclip, Send, Copy, Bot } from "lucide-react"
import { Button } from "@/components/ui/button";
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WhatsappTemplatesModal } from '@/components/whatsapp-templates-modal';
import { Farmer, getFarmersByDealer } from '@/services/farmers.service';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { AiFeatureCard } from '@/components/ai/ai-feature-card';


export default function WhatsappPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(true);
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth');
      } else if (userProfile?.role !== 'dealer') {
        router.push('/dashboard');
      } else if (userProfile.isPremium) {
        setFarmersLoading(true);
        getFarmersByDealer(user.uid).then(newFarmers => {
          setFarmers(newFarmers);
          setFarmersLoading(false);
        });
      } else {
        setFarmersLoading(false);
      }
    }
  }, [user, userProfile, authLoading, router]);

  const handleDraftGenerated = (draft: string) => {
    setMessage(draft);
  };
  
  const handleSelectFarmer = (farmerId: string) => {
    setSelectedFarmers(prev => 
      prev.includes(farmerId) 
        ? prev.filter(id => id !== farmerId)
        : [...prev, farmerId]
    );
  };
  
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedFarmers(farmers.map(f => f.id));
    } else {
      setSelectedFarmers([]);
    }
  };
  
  const handleCopy = () => {
    if (message.trim()) {
      navigator.clipboard.writeText(message);
      toast({ title: 'Message Copied!', description: 'Your message has been copied to the clipboard.' });
    }
  };

  const handleSend = () => {
    if (selectedFarmers.length === 0) {
        toast({ variant: 'destructive', title: 'No Recipients', description: 'Please select at least one farmer.'});
        return;
    }
    if (!message.trim()) {
        toast({ variant: 'destructive', title: 'Empty Message', description: 'Please write a message to send.'});
        return;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');

    toast({
        title: 'Redirecting to WhatsApp',
        description: `Your message is ready. You will need to select the ${selectedFarmers.length} farmer(s) in WhatsApp.`,
        duration: 8000
    });
  };

  const isLoading = authLoading || !userProfile;

  if (isLoading || !user) {
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
          <MainNav userProfile={userProfile}/>
        </SidebarContent>
        <SidebarFooter>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-[calc(100vh)]">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1" />
            <UserNav />
          </header>
           {!userProfile?.isPremium ? (
             <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-md">
                        <AiFeatureCard 
                            icon={<MessageCircle />}
                            title="Unlock WhatsApp Messaging"
                            description="Upgrade to a Premium account to send bulk messages and use AI-powered templates to communicate with your farmers."
                            buttonText="Upgrade to Use WhatsApp Tools"
                            isLocked
                        />
                    </div>
                </div>
             </main>
            ) : (
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-lg font-semibold md:text-2xl font-headline">WhatsApp Messaging</h1>
                    <WhatsappTemplatesModal onDraftGenerated={handleDraftGenerated}>
                        <Button variant="outline">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Use AI Templates
                        </Button>
                    </WhatsappTemplatesModal>
                </div>
                <div className="grid md:grid-cols-3 gap-6 flex-1 overflow-hidden">
                    <Card className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-headline">Recipients ({selectedFarmers.length})</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="select-all" 
                                        onCheckedChange={handleSelectAll}
                                        checked={selectedFarmers.length > 0 && selectedFarmers.length === farmers.length ? true : (selectedFarmers.length > 0 ? 'indeterminate' : false)}
                                    />
                                    <label htmlFor="select-all" className="text-sm font-medium leading-none">Select All</label>
                                </div>
                            </div>
                            <CardDescription>Select the farmers you want to message.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full pr-2">
                                {farmersLoading ? (
                                    <div className="space-y-4">
                                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                                    </div>
                                ) : farmers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center pt-8">No farmers found in your network.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {farmers.map(farmer => (
                                            <div key={farmer.id} className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted/50">
                                                <Checkbox 
                                                    id={`farmer-${farmer.id}`}
                                                    onCheckedChange={() => handleSelectFarmer(farmer.id)}
                                                    checked={selectedFarmers.includes(farmer.id)}
                                                />
                                                <label htmlFor={`farmer-${farmer.id}`} className="text-sm font-medium leading-none w-full cursor-pointer">{farmer.name}</label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2 flex flex-col">
                    <CardContent className="flex-1 flex flex-col p-6">
                        <div className="flex-1 flex flex-col space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Type your message here, or generate one with AI."
                            className="min-h-[200px] flex-1 resize-none"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Button className="w-full" onClick={handleSend} disabled={selectedFarmers.length === 0 || !message.trim()}>
                                <Send className="mr-2 h-4 w-4" /> Send ({selectedFarmers.length})
                            </Button>
                            <Button type="button" variant="outline" size="icon" onClick={handleCopy} disabled={!message.trim()}>
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Copy Message</span>
                            </Button>
                            <Button type="button" variant="outline" size="icon">
                                <Paperclip className="h-4 w-4" />
                                <span className="sr-only">Attach file</span>
                            </Button>
                        </div>
                    </CardContent>
                    </Card>
                </div>
            </main>
            )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
