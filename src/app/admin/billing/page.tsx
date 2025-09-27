// src/app/admin/billing/page.tsx
import { Bird, CreditCard } from "lucide-react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BillingTable } from "@/components/billing-table";

export const revalidate = 0; // Don't cache this page

export default function AdminBillingPage() {
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
            <div className="flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Payment Verification</h1>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Pending Requests</CardTitle>
                    <CardDescription>Review and approve premium subscription payments from users.</CardDescription>
                </CardHeader>
                <CardContent>
                    <BillingTable />
                </CardContent>
             </Card>
          </main>
        </div>
      </SidebarInset>
    </>
  )
}
