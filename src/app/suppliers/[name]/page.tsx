// src/app/suppliers/[name]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Bird, Building, IndianRupee, PlusCircle, Filter, X, Trash2, ChevronDown, ChevronRight } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter as UiTableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getInventoryItemsByPurchaseSource, InventoryItem, deletePurchaseOrder } from '@/services/inventory.service';
import { format } from 'date-fns';
import { getSupplierPayments, Transaction } from '@/services/transactions.service';
import { AddSupplierPaymentModal } from '@/components/add-supplier-payment-modal';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirebase } from '@/firebase';

type PurchaseGroup = {
    purchaseOrderId: string;
    date: Date;
    items: InventoryItem[];
    totalAmount: number;
}

type LedgerEntry = {
    date: Date;
    type: 'purchase' | 'payment';
    balance: number;
    purchase?: PurchaseGroup;
    payment?: Transaction;
};

export default function SupplierLedgerPage() {
  const { user, loading: authLoading } = useUser();
  const { db } = useFirebase();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [allLedgerEntries, setAllLedgerEntries] = useState<LedgerEntry[]>([]);
  const [filteredLedgerEntries, setFilteredLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supplierName = decodeURIComponent(params.name as string);

  // Filter states
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [referenceQuery, setReferenceQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());


  useEffect(() => {
    if (!authLoading && user && db) {
        fetchData();
    } else if (!authLoading && !user) {
        router.push('/');
    }
  }, [user, authLoading, router, supplierName, db]);

  useEffect(() => {
    let filtered = allLedgerEntries;

    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter(entry => {
        const entryDate = entry.date;
        if (dateRange.from && entryDate < dateRange.from) return false;
        // Set to end of day for 'to' date to be inclusive
        if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            if(entryDate > toDate) return false;
        }
        return true;
      });
    }

    if (referenceQuery.trim()) {
        filtered = filtered.filter(entry => {
            const ref = entry.type === 'purchase' ? entry.purchase?.purchaseOrderId : entry.payment?.referenceNumber;
            return ref?.toLowerCase().includes(referenceQuery.toLowerCase())
        });
    }

    setFilteredLedgerEntries(filtered);
  }, [dateRange, referenceQuery, allLedgerEntries]);
  
  const fetchData = async () => {
    if (!user || !db) return;
    setLoading(true);

    const purchases = await getInventoryItemsByPurchaseSource(db, user.uid, supplierName);
    const payments = await getSupplierPayments(db, user.uid, supplierName);

    // Group purchases by purchaseOrderId
    const purchaseGroups: { [key: string]: PurchaseGroup } = purchases.reduce((acc, item) => {
        if (!item.purchaseOrderId) return acc;
        if (!acc[item.purchaseOrderId]) {
            acc[item.purchaseOrderId] = {
                purchaseOrderId: item.purchaseOrderId,
                date: new Date(item.createdAt.seconds * 1000),
                items: [],
                totalAmount: 0
            };
        }
        acc[item.purchaseOrderId].items.push(item);
        const itemCost = (item.purchasePrice || 0) * (item.originalQuantity || item.quantity || 0); // Use originalQuantity
        const gstAmount = itemCost * ((item.gstRate || 0) / 100);
        acc[item.purchaseOrderId].totalAmount += itemCost + gstAmount;
        return acc;
    }, {} as { [key: string]: PurchaseGroup });

    const purchaseEntries: Omit<LedgerEntry, 'balance'>[] = Object.values(purchaseGroups).map(group => ({
        date: group.date,
        type: 'purchase',
        purchase: group,
    }));

    const paymentEntries: Omit<LedgerEntry, 'balance'>[] = payments.map(payment => ({
        date: new Date(payment.date),
        type: 'payment',
        payment: payment,
    }));
    
    const allEntriesUnsorted = [...purchaseEntries, ...paymentEntries];
    const allEntriesSorted = allEntriesUnsorted.sort((a,b) => a.date.getTime() - b.date.getTime());
    
    let runningBalance = 0;
    const entriesWithBalance: LedgerEntry[] = allEntriesSorted.map(entry => {
        if (entry.type === 'purchase') {
            runningBalance += entry.purchase!.totalAmount;
        } else {
            runningBalance -= Math.abs(entry.payment!.amount);
        }
        return { ...entry, balance: runningBalance };
    });

    setAllLedgerEntries(entriesWithBalance.reverse()); // Reverse to show newest first
    setLoading(false);
  }
  
  const handlePaymentAdded = () => {
    fetchData();
  }
  
  const handlePurchaseOrderDeleted = async (purchaseOrderId: string) => {
    if (!db) return;
    try {
      await deletePurchaseOrder(db, purchaseOrderId);
      toast({
        title: "Purchase Order Deleted",
        description: "The PO and its associated items have been removed.",
      });
      fetchData(); // Refresh the ledger
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.message || "Could not delete the purchase order.",
      });
    }
  };


  const clearFilters = () => {
    setDateRange(undefined);
    setReferenceQuery('');
  }
  
  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  }

  const outstandingBalance = allLedgerEntries.length > 0 ? allLedgerEntries[0].balance : 0;

  if (loading || !user) {
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
          <MainNav />
        </SidebarContent>
         <SidebarFooter>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1" />
            <UserNav />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
             <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="font-headline text-xl flex items-center gap-2">
                            <Building className="w-6 h-6 text-primary" />
                            Supplier Ledger: {supplierName}
                        </CardTitle>
                        <CardDescription>A record of all inventory purchased from and payments made to this supplier.</CardDescription>
                    </div>
                     <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="text-right flex-1 md:flex-auto">
                            <div className="text-sm text-muted-foreground">Outstanding Balance</div>
                            <div className={`text-2xl font-bold ${outstandingBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                ₹{Math.abs(outstandingBalance).toLocaleString()}
                            </div>
                        </div>
                        <AddSupplierPaymentModal supplierName={supplierName} onPaymentAdded={handlePaymentAdded}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Payment
                            </Button>
                        </AddSupplierPaymentModal>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-4 mb-4 bg-muted/50 rounded-lg flex-wrap">
                    <Filter className="w-5 h-5 text-muted-foreground hidden md:block" />
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full md:w-[260px] justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                </>
                                ) : (
                                format(dateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Filter by date</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                     <Input 
                        type="search" 
                        placeholder="Search by PO# or Ref..." 
                        value={referenceQuery} 
                        onChange={(e) => setReferenceQuery(e.target.value)}
                        className="w-full md:w-48"
                    />
                    <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground w-full md:w-auto">
                        <X className="mr-2 h-4 w-4" />
                        Clear
                    </Button>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-8 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : filteredLedgerEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No records found for this supplier for the selected filters.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Balance</TableHead>
                        <TableHead className="w-[50px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLedgerEntries.map((entry, index) => {
                        const isPurchase = entry.type === 'purchase';
                        const poId = isPurchase ? entry.purchase!.purchaseOrderId : '';
                        const isExpanded = isPurchase && expandedRows.has(poId);
                        
                        return (
                            <React.Fragment key={index}>
                                <TableRow 
                                    className={cn("border-b", isPurchase && 'cursor-pointer')}
                                    onClick={() => isPurchase && toggleRow(poId)}
                                >
                                    <TableCell className="font-medium whitespace-nowrap">{format(entry.date, 'PPP')}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {isPurchase ? (
                                                <>
                                                 {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                  <span>Purchase Order #{poId.substring(0,6)}</span>
                                                </>
                                            ) : (
                                                entry.payment!.description
                                            )}
                                        </div>
                                        {entry.payment?.referenceNumber && (
                                            <div className="text-xs text-muted-foreground ml-6">Ref: {entry.payment.referenceNumber}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-destructive font-medium">
                                        {isPurchase ? `₹${entry.purchase!.totalAmount.toLocaleString()}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600 font-medium">
                                        {entry.type === 'payment' ? `₹${Math.abs(entry.payment!.amount).toLocaleString()}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-medium hidden md:table-cell">{`₹${entry.balance.toLocaleString()}`}</TableCell>
                                    <TableCell className="text-right">
                                        {isPurchase && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete purchase order #{poId.substring(0,6)} and all associated inventory and payment records. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handlePurchaseOrderDeleted(poId)} variant="destructive">Delete PO</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </TableCell>
                                </TableRow>
                                {isExpanded && (
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableCell colSpan={6} className="p-0">
                                             <div className="p-4">
                                                <h4 className="font-semibold mb-2 text-sm">Items in PO #{poId.substring(0,6)}</h4>
                                                <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Item</TableHead>
                                                        <TableHead>Quantity</TableHead>
                                                        <TableHead>Price/Unit</TableHead>
                                                        <TableHead>GST</TableHead>
                                                        <TableHead className="text-right">Subtotal</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {entry.purchase!.items.map(item => {
                                                        const itemCost = (item.purchasePrice || 0) * (item.originalQuantity || item.quantity || 0);
                                                        const gstAmount = itemCost * ((item.gstRate || 0) / 100);
                                                        const subtotal = itemCost + gstAmount;
                                                        return (
                                                            <TableRow key={item.id} className="text-sm">
                                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                                <TableCell>{item.originalQuantity || item.quantity} {item.unit}</TableCell>
                                                                <TableCell>₹{item.purchasePrice?.toLocaleString()}</TableCell>
                                                                <TableCell>{item.gstRate || 0}%</TableCell>
                                                                <TableCell className="text-right font-medium">₹{subtotal.toLocaleString()}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                                <UiTableFooter>
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="font-bold">Total</TableCell>
                                                        <TableCell className="font-bold">
                                                            
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">
                                                            ₹{entry.purchase!.totalAmount.toLocaleString()}
                                                        </TableCell>
                                                    </TableRow>
                                                </UiTableFooter>
                                                </Table>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        )
                      })}
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
