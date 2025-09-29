// src/app/admin/billing/page.tsx
'use client';
import { CreditCard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BillingTable } from "@/components/billing-table";

export default function AdminBillingPage() {
  return (
    <>
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
    </>
  )
}
