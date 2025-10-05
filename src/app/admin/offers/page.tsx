// src/app/admin/offers/page.tsx
'use client';
import { OffersList } from "@/components/offers-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AdminOffersPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/auth');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);
  
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
