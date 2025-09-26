// src/app/admin/billing/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Bird, ShieldCheck, Check, X, CreditCard, TicketPercent } from "lucide-react"
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
import { PaymentVerificationRequest, getPendingPaymentVerifications, approvePaymentVerification, rejectPaymentVerification } from '@/services/billing.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { PaymentVerificationDialog } from '@/components/payment-verification-dialog';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function AdminBillingPage() {
  useAdminAuth();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PaymentVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  useEffect(() => {
    if(userProfile?.role === 'admin') {
      const unsubscribe = getPendingPaymentVerifications((newRequests) => {
        setRequests(newRequests);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [userProfile]);
  
  const handleApprove = async (request: PaymentVerificationRequest, reason: string) => {
    setUpdatingId(request.id);
    try {
      await approvePaymentVerification(request.id, request.userId, reason);
      toast({ title: "Payment Approved", description: `${request.userName}'s premium plan has been activated.`});
    } catch (error: any) {
       toast({ variant: "destructive", title: "Approval Failed", description: error.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (request: PaymentVerificationRequest, reason: string) => {
     setUpdatingId(request.id);
    try {
      await rejectPaymentVerification(request.id, reason, request.userId);
       toast({ title: "Payment Rejected", description: `The request from ${request.userName} has been rejected.`});
    } catch (error: any) {
       toast({ variant: "destructive", title: "Rejection Failed", description: error.message });
    } finally {
      setUpdatingId(null);
    }
  };


  if (!userProfile) {
    return (
       <div className="flex flex-col h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6"><Skeleton className="h-8 w-32" /><div className="w-full flex-1" /><Skeleton className="h-9 w-9 rounded-full" /></header>
        <div className="flex flex-1">
            <aside className="hidden md:flex flex-col w-64 border-r p-4 gap-4"><Skeleton className="h-8 w-40 mb-4" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></aside>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6"><Skeleton className="h-8 w-48" /><div className="flex-1 rounded-lg border border-dashed shadow-sm p-6"><Skeleton className="h-64 w-full" /></div></main>
        </div>
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
                    {loading ? (
                         <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-8 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center gap-2">
                            <ShieldCheck className="w-12 h-12 text-green-500" />
                            <h3 className="font-semibold">All Clear!</h3>
                            <p className="text-muted-foreground">There are no pending payment requests.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Offer</TableHead>
                                <TableHead>Reference/UTR</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>{format(req.createdAt.toDate(), 'dd/MM/yy, p')}</TableCell>
                                    <TableCell className="font-medium">{req.userName}<br/><span className="text-xs text-muted-foreground">{req.userEmail}</span></TableCell>
                                    <TableCell><Badge variant="outline">{req.planType}</Badge></TableCell>
                                    <TableCell>
                                        {req.discountedAmount !== undefined ? (
                                            <div className="flex flex-col">
                                                <span className="font-bold">₹{req.discountedAmount.toLocaleString()}</span>
                                                <span className="text-xs text-muted-foreground line-through">₹{req.amount.toLocaleString()}</span>
                                            </div>
                                        ) : (
                                            <span>₹{req.amount.toLocaleString()}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {req.promoCode ? (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                <TicketPercent className="w-3 h-3" />
                                                {req.promoCode}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{req.referenceNumber}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <PaymentVerificationDialog
                                                action="reject"
                                                request={req}
                                                onConfirm={handleReject}
                                                disabled={!!updatingId}
                                            >
                                                <Button size="sm" variant="destructive" disabled={!!updatingId}>
                                                    <X className="mr-2 h-4 w-4" /> Reject
                                                </Button>
                                            </PaymentVerificationDialog>
                                            <PaymentVerificationDialog
                                                action="approve"
                                                request={req}
                                                onConfirm={handleApprove}
                                                disabled={!!updatingId}
                                            >
                                                 <Button size="sm" disabled={!!updatingId}>
                                                    <Check className="mr-2 h-4 w-4" /> Approve
                                                </Button>
                                            </PaymentVerificationDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
             </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
