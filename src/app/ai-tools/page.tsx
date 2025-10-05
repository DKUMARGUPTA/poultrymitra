// src/app/ai-tools/page.tsx
"use client";

import { useAuth } from '@/hooks/use-auth';
import { Bird, FlaskConical, Calculator, BrainCircuit, Bot, MessageCircle } from "lucide-react"
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
import { AiFeatureCard } from '@/components/ai/ai-feature-card';
import { DiseaseDetectionModal } from '@/components/disease-detection-modal';
import { SmartAdvisoryModal } from '@/components/smart-advisory-modal';
import { StockAdvisoryModal } from '@/components/stock-advisory-modal';
import { WhatsappTemplatesModal } from '@/components/whatsapp-templates-modal';
import { FeedCalculator } from '@/components/feed-calculator';

export default function AiToolsPage() {
  const { user, userProfile, loading } = useAuth();
  
  if (loading || !user || !userProfile) {
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
  
  const isPremium = !!userProfile?.isPremium;

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
          <MainNav userProfile={userProfile} />
        </SidebarContent>
        <SidebarFooter>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1" />
            <UserNav user={user} userProfile={userProfile} />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold md:text-2xl font-headline">AI Suite & Tools</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div className="xl:col-span-2">
                  <FeedCalculator />
                </div>
                <DiseaseDetectionModal>
                    <div className="h-full">
                        <AiFeatureCard 
                            icon={<FlaskConical />}
                            title="Disease Detection"
                            description="Enter symptoms to get probable issues and suggestions."
                            buttonText="Start Diagnosing"
                            isLocked={!isPremium}
                        />
                    </div>
                </DiseaseDetectionModal>
                <SmartAdvisoryModal>
                <div className="h-full">
                    <AiFeatureCard 
                        icon={<BrainCircuit />}
                        title="Smart Advisory"
                        description="Get AI advice on batch health and growth rate trends."
                        buttonText="Get Advisory"
                        isLocked={!isPremium}
                    />
                </div>
                </SmartAdvisoryModal>
                {userProfile?.role === 'dealer' && (
                  <>
                    <StockAdvisoryModal>
                        <div className="h-full">
                            <AiFeatureCard 
                            icon={<Bot />}
                            title="AI Stock Advisory"
                            description="Get AI-driven advice for stock planning and payment tracking."
                            buttonText="Get Stock Advice"
                            isLocked={!isPremium}
                            />
                        </div>
                    </StockAdvisoryModal>
                    <WhatsappTemplatesModal>
                        <div className="h-full">
                            <AiFeatureCard 
                                icon={<MessageCircle />}
                                title="Smart WhatsApp Templates"
                                description="Generate AI-powered WhatsApp drafts for reminders and alerts."
                                buttonText="Create Draft"
                                isLocked={!isPremium}
                            />
                        </div>
                    </WhatsappTemplatesModal>
                  </>
                )}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
