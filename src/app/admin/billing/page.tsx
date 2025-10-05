// src/app/admin/billing/page.tsx
'use client';
import { CreditCard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BillingTable } from "@/components/billing-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/firebase";

export default function AdminBillingPage() {
  const { loading } = useUser();

  if (loading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </main>
    )
  }

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
