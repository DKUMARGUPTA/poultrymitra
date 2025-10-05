// src/app/admin/offers/page.tsx
'use client';
import { OffersList } from "@/components/offers-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export default function AdminOffersPage() {
  const { loading } = useAuth();
  
  if (loading) {
     return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Skeleton className="h-96" />
        </main>
    )
  }
  
  return (
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <OffersList />
      </main>
  )
}
