// src/components/billing-table.tsx
'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PaymentVerificationRequest, getPendingPaymentVerifications, approvePaymentVerification, rejectPaymentVerification } from '@/services/billing.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { PaymentVerificationDialog } from '@/components/payment-verification-dialog';
import { ShieldCheck, TicketPercent, Check, X } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export function BillingTable({ initialRequests }: { initialRequests: PaymentVerificationRequest[] }) {
    const { toast } = useToast();
    const [requests, setRequests] = useState<PaymentVerificationRequest[]>(initialRequests);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = getPendingPaymentVerifications((newRequests) => {
            setRequests(newRequests);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleApprove = async (request: PaymentVerificationRequest, reason: string) => {
        setUpdatingId(request.id);
        try {
            await approvePaymentVerification(request.id, request.userId, reason);
            toast({ title: "Payment Approved", description: `${request.userName}'s premium plan has been activated.` });
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
            toast({ title: "Payment Rejected", description: `The request from ${request.userName} has been rejected.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Rejection Failed", description: error.message });
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-8 w-full" />
                    </div>
                ))}
            </div>
        )
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-12 flex flex-col items-center gap-2">
                <ShieldCheck className="w-12 h-12 text-green-500" />
                <h3 className="font-semibold">All Clear!</h3>
                <p className="text-muted-foreground">There are no pending payment requests.</p>
            </div>
        )
    }
    
    return (
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
    )
}
