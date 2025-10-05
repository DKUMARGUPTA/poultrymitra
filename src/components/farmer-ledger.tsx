

'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter as UiTableFooter,
} from '@/components/ui/table';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Transaction, getTransactionsForFarmer, deleteTransaction } from '@/services/transactions.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { getFarmer, Farmer } from '@/services/farmers.service';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { FileDown, PlusCircle, Trash2, Phone, ShoppingCart, MoreVertical, Copy, ChevronRight, ChevronDown, Edit, MessageSquare } from 'lucide-react';
import { AddTransactionModal } from './add-transaction-modal';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DeleteTransactionAlert } from './delete-transaction-alert';
import { getUserProfile } from '@/services/users.service';
import { CreateOrderModal } from './create-order-modal';
import { Order, getOrderById } from '@/services/orders.service';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import React from 'react';
import { Separator } from './ui/separator';
import { EditTransactionModal } from './edit-transaction-modal';
import { SendNotificationModal } from './send-notification-modal';
import { UserProfile } from '@/services/users.service';
import { useFirebase } from '@/firebase';


interface FarmerLedgerProps {
    farmerId: string;
}

export function FarmerLedger({ farmerId }: FarmerLedgerProps) {
  const { db } = useFirebase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [farmerUserProfile, setFarmerUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedOrderDetails, setExpandedOrderDetails] = useState<{ [key: string]: Order | null }>({});

  const { toast } = useToast();

  useEffect(() => {
    async function fetchInitialData() {
        setLoading(true);
        if(!db) return;
        const farmerData = await getFarmer(db, farmerId);
        setFarmer(farmerData);
        if (farmerData) {
            if (farmerData.uid) {
                const userProfile = await getUserProfile(farmerData.uid);
                setFarmerUserProfile(userProfile);
            }
            getTransactionsForFarmer(db, farmerId, (transactionData) => {
              setTransactions(transactionData);
            });
        }
        setLoading(false);
    }
    fetchInitialData();
  }, [farmerId, db]);
  
  const refreshData = async () => {
    if(!db) return;
     const farmerData = await getFarmer(db, farmerId);
     setFarmer(farmerData);
     getTransactionsForFarmer(db, farmerId, (transactionData) => {
        setTransactions(transactionData);
     });
  }
  
  const toggleRow = async (transaction: Transaction) => {
    const transactionId = transaction.id;
    const purchaseOrderId = transaction.purchaseOrderId;
    const newSet = new Set(expandedRows);

    if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
    } else {
        newSet.add(transactionId);
        if (purchaseOrderId && !expandedOrderDetails[purchaseOrderId]) {
            if (!db) return;
            const orderDetails = await getOrderById(db, purchaseOrderId);
            setExpandedOrderDetails(prev => ({ ...prev, [purchaseOrderId]: orderDetails }));
        }
    }
    setExpandedRows(newSet);
  };


  const handleTransactionAction = () => {
    refreshData();
  };
  
  const handleOrderCreated = (newOrder: Order) => {
    refreshData();
  }

  const handleTransactionDeleted = (deletedTransactionId: string) => {
    refreshData();
    toast({
      title: "Transaction Deleted",
      description: "The transaction has been successfully removed.",
    });
  };

  const exportToCSV = () => {
    if (!farmer) return;
    setExporting(true);

    try {
        const csvData = transactions.map(t => ({
            'Transaction ID': t.id,
            'Date': format(new Date(t.date), "yyyy-MM-dd HH:mm:ss"),
            'Description': t.description,
            'Amount': t.amount,
            'Status': t.status,
            'Payment Method': t.paymentMethod,
            'Reference': t.referenceNumber,
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const farmerName = farmer.name.replace(/\s/g, '_');
        link.setAttribute('href', url);
        link.setAttribute('download', `ledger-${farmerName}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Export Successful', description: `${farmer.name}'s ledger has been downloaded as a CSV.`});
    } catch (error) {
        console.error("CSV Export failed: ", error);
        toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export ledger data.'});
    } finally {
        setExporting(false);
    }
  }
  
  const handleCopyCode = (code: string | undefined) => {
    if (code) {
        navigator.clipboard.writeText(code);
        toast({ title: "Copied!", description: "Farmer code has been copied to the clipboard."});
    }
  }

  const exportToPDF = () => {
    if (!farmer) return;
    setExporting(true);
    
    try {
      const doc = new jsPDF();
      const head = [['Date', 'Description', 'Method', 'Status', 'Amount']];
      const body = transactions.map(t => [
        format(new Date(t.date), 'dd/MM/yy HH:mm'),
        t.description,
        t.paymentMethod || 'N/A',
        t.status,
        t.amount > 0 ? `+₹${t.amount.toLocaleString()}` : `-₹${Math.abs(t.amount).toLocaleString()}`,
      ]);

      doc.setFontSize(18);
      doc.text(`Ledger for ${farmer.name}`, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30);
      doc.text(`Outstanding Balance: ₹${farmer.outstanding.toLocaleString()}`, 14, 36);

      (doc as any).autoTable({
        head: head,
        body: body,
        startY: 40,
        headStyles: { fillColor: [34, 139, 34] }, // Primary green color
        didDrawPage: (data: any) => {
            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });
      
      const farmerName = farmer.name.replace(/\s/g, '_');
      doc.save(`ledger-${farmerName}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast({ title: 'Export Successful', description: `${farmer.name}'s ledger has been downloaded as a PDF.`});

    } catch (error) {
        console.error("PDF Export failed: ", error);
        toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export ledger data to PDF.'});
    } finally {
        setExporting(false);
    }
  }
  
  if (loading || !farmer) {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-10 w-64" />
              <div className="flex gap-2">
                 <Skeleton className="h-10 w-44" />
                 <Skeleton className="h-10 w-36" />
              </div>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className='space-y-2'>
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mt-4 border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="hidden sm:table-cell">Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  const totalOutstanding = farmer.outstanding;

  return (
    <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-lg font-semibold md:text-2xl font-headline">Farmer Ledger: {farmer.name}</h1>
             <div className="flex gap-2">
                {farmerUserProfile && (
                  <SendNotificationModal farmer={farmerUserProfile}>
                    <Button variant="outline"><MessageSquare className="mr-2 h-4 w-4" /> Send Notification</Button>
                  </SendNotificationModal>
                )}
                <CreateOrderModal onOrderCreated={handleOrderCreated} farmer={farmer}>
                    <Button variant="secondary">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Create Order
                    </Button>
                </CreateOrderModal>
                <AddTransactionModal onTransactionAdded={handleTransactionAction} farmerId={farmer.id}>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Payment
                </Button>
                </AddTransactionModal>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={exporting}>
                            <FileDown className="mr-2 h-4 w-4" />
                            {exporting ? 'Exporting...' : 'Export'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={exportToCSV}>Export as CSV</DropdownMenuItem>
                        <DropdownMenuItem onSelect={exportToPDF}>Export as PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://picsum.photos/seed/${farmer.id}/100`} data-ai-hint="person portrait" />
                            <AvatarFallback>{farmer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className='font-headline text-2xl'>{farmer.name}</CardTitle>
                            <div className={cn("text-sm text-muted-foreground", "flex flex-col gap-1 mt-1")}>
                                <span>{farmer.location}</span>
                                {farmerUserProfile?.phoneNumber && (
                                    <a href={`tel:${farmerUserProfile.phoneNumber}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:underline">
                                        <Phone className="w-3 h-3"/>
                                        {farmerUserProfile.phoneNumber}
                                    </a>
                                )}
                                {farmer.farmerCode && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded">{farmer.farmerCode}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyCode(farmer.farmerCode)}>
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                     <div className="text-right">
                        <div className="text-sm text-muted-foreground">Outstanding Balance</div>
                        <div className={cn('text-2xl font-bold', totalOutstanding > 0 ? 'text-destructive' : 'text-green-600')}>
                           ₹{Math.abs(totalOutstanding).toLocaleString()}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
            {transactions.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[200px]">
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h3 className="text-2xl font-bold tracking-tight">No transactions yet</h3>
                        <p className="text-sm text-muted-foreground">This farmer's transactions will appear here.</p>
                    </div>
                </div>
            ) : (
            <div className="mt-4 border rounded-lg">
                 <TooltipProvider>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="hidden sm:table-cell">Method</TableHead>
                        <TableHead className="hidden md:table-cell">Ref / Order ID</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[50px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction) => {
                            const isSale = !!transaction.purchaseOrderId;
                            const isExpanded = expandedRows.has(transaction.id);
                            const orderDetails = transaction.purchaseOrderId ? expandedOrderDetails[transaction.purchaseOrderId] : null;

                            return (
                                <React.Fragment key={transaction.id}>
                                <TableRow onClick={() => isSale && toggleRow(transaction)} className={cn(isSale && 'cursor-pointer')}>
                                    <TableCell>
                                      {isSale ? (isExpanded ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>) : null}
                                    </TableCell>
                                    <TableCell>
                                    <div className="font-medium whitespace-nowrap">{format(new Date(transaction.date), "dd/MM/yy, p")}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div>{transaction.description}</div>
                                        {transaction.inventoryItemName && !isSale && (
                                            <div className="text-xs text-muted-foreground">
                                                {transaction.inventoryItemName}
                                            </div>
                                        )}
                                        {transaction.remarks && (
                                            <div className="text-xs text-muted-foreground">
                                                Remark: {transaction.remarks}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-muted-foreground">{transaction.paymentMethod}</TableCell>
                                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground truncate">
                                        {transaction.purchaseOrderId && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Link href={`/orders`} className="hover:underline">
                                                        PO #{transaction.purchaseOrderId.substring(0, 6)}...
                                                    </Link>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Order ID: {transaction.purchaseOrderId}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                        {transaction.referenceNumber && (
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <p>Ref: {transaction.referenceNumber}</p>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{transaction.referenceNumber}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                    <Badge
                                        variant={transaction.status === 'Paid' ? 'secondary' : 'destructive'}
                                        className={
                                        transaction.status === 'Paid'
                                            ? 'text-green-700 border-green-500/50'
                                            : ''
                                        }
                                    >
                                        {transaction.status}
                                    </Badge>
                                    </TableCell>
                                    <TableCell className={`text-right font-medium`}>
                                        <div className={`${transaction.amount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                            {transaction.amount > 0 ? `+₹${transaction.amount.toLocaleString()}` : `-₹${Math.abs(transaction.amount).toLocaleString()}`}
                                        </div>
                                        {(transaction.costOfGoodsSold ?? 0) > 0 && (
                                            <div className="text-xs text-muted-foreground">
                                            (Cost: ₹{transaction.costOfGoodsSold!.toLocaleString()})
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                 <EditTransactionModal transaction={transaction} onTransactionUpdated={handleTransactionAction}>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                        <Edit className="mr-2 h-4 w-4"/> Edit
                                                    </DropdownMenuItem>
                                                 </EditTransactionModal>
                                                <DeleteTransactionAlert 
                                                    transaction={transaction} 
                                                    onTransactionDeleted={() => handleTransactionDeleted(transaction.id)}>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DeleteTransactionAlert>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                {isExpanded && (
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableCell colSpan={8} className="p-0">
                                             <div className="p-4">
                                                <h4 className="font-semibold mb-2 text-sm">Items in PO #{transaction.purchaseOrderId?.substring(0, 6)}</h4>
                                                <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Item</TableHead>
                                                        <TableHead>Quantity</TableHead>
                                                        <TableHead>Price/Unit</TableHead>
                                                        <TableHead className="text-right">Subtotal</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {orderDetails ? orderDetails.items.map(item => (
                                                        <TableRow key={item.itemId} className="text-sm">
                                                            <TableCell className="font-medium">{item.name}</TableCell>
                                                            <TableCell>{item.quantity} {item.unit}</TableCell>
                                                            <TableCell>₹{item.price.toLocaleString()}</TableCell>
                                                            <TableCell className="text-right font-medium">₹{(item.price * item.quantity).toLocaleString()}</TableCell>
                                                        </TableRow>
                                                    )) : (
                                                         <TableRow><TableCell colSpan={4}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                                                    )}
                                                </TableBody>
                                                 {orderDetails && (
                                                    <UiTableFooter>
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="font-bold">Total</TableCell>
                                                            <TableCell className="text-right font-bold">
                                                                ₹{orderDetails.totalAmount.toLocaleString()}
                                                            </TableCell>
                                                        </TableRow>
                                                    </UiTableFooter>
                                                )}
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
                </TooltipProvider>
            </div>
            )}
            </CardContent>
        </Card>
    </div>
  );
}
