
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Bird, FileDown, PlusCircle, Wallet, ChevronRight, ChevronDown, User } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, getBusinessExpenses } from '@/services/transactions.service';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddExpenseModal } from '@/components/add-expense-modal';
import Link from 'next/link';

export default function ExpensesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      setExpensesLoading(true);
      const unsubscribe = getBusinessExpenses(user.uid, (newExpenses) => {
        setExpenses(newExpenses);
        setExpensesLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleExpenseAdded = (newExpense: Transaction) => {
    setExpenses(prev => [newExpense, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

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
  };

  const handleExportCSV = () => {
    setExporting(true);
    try {
      const csvData = expenses.map(t => ({
        ID: t.id,
        Date: format(new Date(t.date), "yyyy-MM-dd HH:mm:ss"),
        Description: t.description,
        Amount: t.amount,
        'Payment Method': t.paymentMethod,
        'Reference': t.referenceNumber,
        'Remarks': t.remarks,
        'Purchase Order ID': t.purchaseOrderId,
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `business-expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Export Successful', description: 'Your expenses have been downloaded as a CSV.'});
    } catch (error) {
      console.error("CSV Export failed: ", error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export your expenses.'});
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    setExporting(true);
    try {
        const doc = new jsPDF();
        
        const head = [['Date', 'Description', 'Method', 'Amount']];
        const body = expenses.map(t => [
            format(new Date(t.date), 'dd/MM/yy, p'),
            t.description,
            t.paymentMethod || 'N/A',
            `₹${Math.abs(t.amount).toLocaleString()}`,
        ]);

        doc.setFontSize(18);
        doc.text(`Business Expenses Log`, 14, 22);
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

        doc.save(`business-expenses-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast({ title: 'Export Successful', description: 'Your expenses have been downloaded as a PDF.'});

    } catch (error) {
        console.error("PDF Export failed: ", error);
        toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export expenses to PDF.'});
    } finally {
        setExporting(false);
    }
  };

  if (loading || !user) {
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
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl font-headline flex items-center gap-2"><Wallet/>Business Expenses</h1>
                <div className="flex gap-2">
                    <AddExpenseModal onExpenseAdded={handleExpenseAdded}>
                        <Button><PlusCircle className="mr-2 h-4 w-4" />Log Expense</Button>
                    </AddExpenseModal>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" disabled={exporting || expenses.length === 0}><FileDown className="mr-2 h-4 w-4" />{exporting ? 'Exporting...' : 'Export'}</Button>
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
                    <CardTitle className="font-headline">Expense History</CardTitle>
                    <CardDescription>A log of all your recorded business expenses. Click a row to see more details.</CardDescription>
                </CardHeader>
                <CardContent>
                    {expensesLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[200px]">
                            <div className="flex flex-col items-center gap-1 text-center">
                                <h3 className="text-2xl font-bold tracking-tight">No expenses logged yet</h3>
                                <p className="text-sm text-muted-foreground">Click "Log Expense" to add your first business expense.</p>
                                <AddExpenseModal onExpenseAdded={handleExpenseAdded}>
                                    <Button className="mt-4"><PlusCircle className="mr-2 h-4 w-4" />Log First Expense</Button>
                                </AddExpenseModal>
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map((expense) => (
                                <React.Fragment key={expense.id}>
                                    <TableRow onClick={() => toggleRow(expense.id)} className="cursor-pointer">
                                        <TableCell>
                                            {expandedRows.has(expense.id) ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
                                        </TableCell>
                                        <TableCell>{format(new Date(expense.date), 'dd/MM/yy')}</TableCell>
                                        <TableCell className="font-medium">{expense.description}</TableCell>
                                        <TableCell>{expense.paymentMethod}</TableCell>
                                        <TableCell className="text-right font-medium text-destructive">-₹{Math.abs(expense.amount).toLocaleString()}</TableCell>
                                    </TableRow>
                                    {expandedRows.has(expense.id) && (
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell colSpan={5} className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="font-semibold flex items-center gap-1"><User className="w-4 h-4 text-muted-foreground"/>Paid To</p>
                                                        <p className="text-muted-foreground pl-5">{expense.userName || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">Reference Number</p>
                                                        <p className="text-muted-foreground">{expense.referenceNumber || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">Remarks</p>
                                                        <p className="text-muted-foreground">{expense.remarks || 'N/A'}</p>
                                                    </div>
                                                     <div>
                                                        <p className="font-semibold">Transaction ID</p>
                                                        <p className="text-muted-foreground text-xs font-mono">{expense.id}</p>
                                                    </div>
                                                    {expense.purchaseOrderId && (
                                                         <div>
                                                            <p className="font-semibold">Linked Purchase Order</p>
                                                            <p className="text-muted-foreground">
                                                                This expense is part of PO
                                                                <Button variant="link" asChild className="p-1 h-auto">
                                                                    <Link href={`/suppliers/${expense.userName}`}>
                                                                        #{expense.purchaseOrderId.substring(0, 6)}...
                                                                    </Link>
                                                                </Button>
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
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
