"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Bird, Bot, Sparkles, Image as ImageIcon, Loader } from "lucide-react"
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
import { AiFeatureCard } from '@/components/ai/ai-feature-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { generateImage } from '@/ai/flows/generate-image';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function ImageGenerationPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPremium = !!userProfile?.isPremium;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
        toast({ variant: 'destructive', title: 'Prompt is empty', description: 'Please enter a description for the image you want to create.' });
        return;
    }
    if (!isPremium) {
        toast({ variant: 'destructive', title: 'Premium Feature', description: 'Please upgrade to generate images with AI.' });
        return;
    }

    setLoading(true);
    setGeneratedImage(null);
    try {
        const result = await generateImage({ prompt });
        setGeneratedImage(result.imageUrl);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Image Generation Failed', description: e.message });
    } finally {
        setLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
       <div className="flex flex-col h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6"><Skeleton className="h-8 w-32" /><div className="w-full flex-1" /><Skeleton className="h-9 w-9 rounded-full" /></header>
        <div className="flex flex-1"><main className="flex-1 p-6"><Skeleton className="h-[calc(100vh-100px)] w-full" /></main></div>
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
            <div className="flex items-center gap-2"><ImageIcon className="w-6 h-6" /><h1 className="text-lg font-semibold md:text-2xl font-headline">AI Image Generation</h1></div>
            
            {!isPremium ? (
                 <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-md">
                        <AiFeatureCard 
                            icon={<ImageIcon />}
                            title="Unlock AI Image Generation"
                            description="Upgrade to a Premium account to create stunning, unique images from just a text description."
                            buttonText="Upgrade to Generate Images"
                            isLocked
                        />
                    </div>
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Image Prompt</CardTitle>
                        <CardDescription>Describe the image you want to create. Be as specific as you like.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Input placeholder="e.g., A photorealistic image of a healthy chick drinking water" value={prompt} onChange={e => setPrompt(e.target.value)} disabled={loading} />
                            <Button onClick={handleGenerate} disabled={loading} className="w-full sm:w-auto">
                                {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Generate
                            </Button>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-center rounded-lg border border-dashed min-h-[400px] bg-muted/50 p-4">
                            {loading ? (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Loader className="h-8 w-8 animate-spin" />
                                    <p>Generating your image... this may take a moment.</p>
                                </div>
                            ) : generatedImage ? (
                                <Image src={generatedImage} alt={prompt} width={512} height={512} className="rounded-md object-contain" />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <ImageIcon className="mx-auto h-12 w-12" />
                                    <p>Your generated image will appear here.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
