
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Bird, FileDown, PlusCircle, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button";
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
import { TransactionHistory } from '@/components/transaction-history';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddTransactionModal } from '@/components/add-transaction-modal';
import { Transaction, getAllTransactionsAsync } from '@/services/transactions.service';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function TransactionsPage() {
  useAdminAuth();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleTransactionAdded = (newTransaction: Transaction) => {
    setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const allTransactions = await getAllTransactionsAsync();
      const csvData = allTransactions.map(t => ({
        ID: t.id,
        Date: format(new Date(t.date), "yyyy-MM-dd HH:mm:ss"),
        Description: t.description,
        Amount: t.amount,
        Status: t.status,
        'User Name': t.userName,
        'User ID': t.userId,
        'Dealer ID': t.dealerId,
        'Payment Method': t.paymentMethod,
        'Reference': t.referenceNumber,
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Export Successful', description: 'Transaction data has been downloaded as a CSV.'});
    } catch (error) {
      console.error("CSV Export failed: ", error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export transaction data.'});
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
        const allTransactions = await getAllTransactionsAsync();
        const doc = new jsPDF();
        
        const head = [['Date', 'User', 'Description', 'Status', 'Amount']];
        const body = allTransactions.map(t => [
            format(new Date(t.date), 'dd/MM/yy, p'),
            t.userName,
            t.description,
            t.status,
            t.amount >= 0 ? `+₹${t.amount.toLocaleString()}` : `-₹${Math.abs(t.amount).toLocaleString()}`,
        ]);

        doc.setFontSize(18);
        doc.text(`Global Transaction Log`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30);
        
        (doc as any).autoTable({
            head: head,
            body: body,
            startY: 35,
            headStyles: { fillColor: [34, 139, 34] },
             didDrawPage: (data: any) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(10);
                doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        doc.save(`global-transactions-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast({ title: 'Export Successful', description: 'Transaction data has been downloaded as a PDF.'});

    } catch (error) {
        console.error("PDF Export failed: ", error);
        toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export transaction data to PDF.'});
    } finally {
        setExporting(false);
    }
  };


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
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1" />
            <UserNav />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold md:text-2xl font-headline flex items-center gap-2">
                <Briefcase />
                All Transactions
              </h1>
              <div className="flex gap-2">
                {/* <AddTransactionModal onTransactionAdded={handleTransactionAdded}>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Transaction
                  </Button>
                </AddTransactionModal> */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={exporting}>
                        <FileDown className="mr-2 h-4 w-4" />
                        {exporting ? 'Exporting...' : 'Export All'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={handleExportCSV}>Export as CSV</DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleExportPDF}>Export as PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Global Transaction Log</CardTitle>
                    <CardDescription>View all recent transactions across all users.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TransactionHistory key={transactions.length} scope="all" />
                </CardContent>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
