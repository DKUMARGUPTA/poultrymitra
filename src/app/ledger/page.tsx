// src/app/ledger/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bird, FileDown, PlusCircle } from "lucide-react"
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
import { Transaction, getTransactionsForUser } from '@/services/transactions.service';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserProfile, getUserProfile } from '@/services/users.service';


export default function LedgerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exporting, setExporting] = useState(false);
  
  const [refreshKey, setRefreshKey] = useState(0); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            const profile = await getUserProfile(currentUser.uid);
            setUserProfile(profile);
            if (profile?.role === 'admin') {
                router.push('/admin');
            }
        } else {
            setUser(null);
            setUserProfile(null);
            router.push('/auth');
        }
        setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleTransactionAdded = (newTransaction: Transaction) => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to export.'});
        setExporting(false);
        return;
    }
    try {
      const allTransactions = await getTransactionsForUser(user.uid);
      const csvData = allTransactions.map(t => ({
        ID: t.id,
        Date: format(new Date(t.date), "yyyy-MM-dd HH:mm:ss"),
        Description: t.description,
        Amount: t.amount,
        Status: t.status,
        'User Name': t.userName,
        'Dealer ID': t.dealerId,
        'Payment Method': t.paymentMethod,
        'Reference': t.referenceNumber,
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `my-ledger-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Export Successful', description: 'Your ledger has been downloaded as a CSV.'});
    } catch (error) {
      console.error("CSV Export failed: ", error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export your ledger.'});
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to export.'});
        setExporting(false);
        return;
    }
    try {
        const allTransactions = await getTransactionsForUser(user.uid);
        const doc = new jsPDF();
        
        const head = [['Date', 'Description', 'Method', 'Status', 'Amount']];
        const body = allTransactions.map(t => [
            format(new Date(t.date), 'dd/MM/yy, p'),
            t.description,
            t.paymentMethod || 'N/A',
            t.status,
            t.amount >= 0 ? `+₹${t.amount.toLocaleString()}` : `-₹${Math.abs(t.amount).toLocaleString()}`,
        ]);

        doc.setFontSize(18);
        doc.text(`My Transaction Ledger`, 14, 22);
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

        doc.save(`my-ledger-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast({ title: 'Export Successful', description: 'Your ledger has been downloaded as a PDF.'});

    } catch (error) {
        console.error("PDF Export failed: ", error);
        toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export your ledger to PDF.'});
    } finally {
        setExporting(false);
    }
  };

  const isLoading = authLoading || !userProfile;
  if (isLoading) {
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
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Bird className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-headline text-primary">Poultry Mitra</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <MainNav userProfile={userProfile} />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1" />
            <UserNav user={user} userProfile={userProfile} />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold md:text-2xl font-headline">My Ledger</h1>
              <div className="flex gap-2">
                <AddTransactionModal onTransactionAdded={handleTransactionAdded}>
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
                        <DropdownMenuItem onSelect={handleExportCSV}>Export as CSV</DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleExportPDF}>Export as PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">My Transactions</CardTitle>
                    <CardDescription>View your recent transactions with your dealer.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TransactionHistory key={refreshKey} scope="user"/>
                </CardContent>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
