// src/app/admin/offers/page.tsx
import { Bird, TicketPercent, PlusCircle } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionOffer, getActiveOffers } from '@/services/offers.service';
import { Button } from '@/components/ui/button';
import { OffersList } from "@/components/offers-list";

export const revalidate = 0;

export default async function AdminOffersPage() {
  const initialOffers = await getActiveOffers();
  
  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4"><div className="flex items-center gap-2"><Bird className="w-8 h-8 text-primary" /><h1 className="text-2xl font-headline text-primary">Poultry Mitra</h1></div></SidebarHeader>
        <SidebarContent><MainNav /></SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6"><SidebarTrigger className="md:hidden" /><div className="w-full flex-1" /><UserNav /></header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
             <OffersList initialOffers={initialOffers} />
          </main>
        </div>
      </SidebarInset>
    </>
  )
}
