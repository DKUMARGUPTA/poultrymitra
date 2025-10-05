
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getTransactionsForUser, Transaction } from '@/services/transactions.service';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DateRangePicker } from "@tremor/react";
import { format, subDays } from 'date-fns';
import { Download } from 'lucide-react';
import { Button } from '../ui/button';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirebase } from '@/firebase';


export function SalesReport() {
    const { user } = useUser();
    const { db } = useFirebase();
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [dateRange, setDateRange] = useState<any>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    useEffect(() => {
        if (user && db) {
            setLoading(true);
            const unsubscribe = getTransactionsForUser(db, user.uid, (transactions) => {
                // Filter for sales to farmers, excluding general business expenses
                const sales = transactions.filter(t => 
                    t.description.toLowerCase().includes('sale') && 
                    t.isBusinessExpense !== true
                );
                setAllTransactions(sales);
                setLoading(false);
            }, true); // isDealerView = true
            return () => unsubscribe();
        }
    }, [user, db]);

    useEffect(() => {
        let filtered = allTransactions;
        if (dateRange?.from) {
            filtered = filtered.filter(t => new Date(t.date) >= dateRange.from);
        }
        if (dateRange?.to) {
             const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(t => new Date(t.date) <= toDate);
        }
        setFilteredTransactions(filtered);
    }, [dateRange, allTransactions]);

    const totals = filteredTransactions.reduce((acc, t) => {
        // For a dealer, revenue from a sale is a positive amount.
        // The `amount` field in a sale transaction is positive for the dealer ledger.
        acc.revenue += t.amount;
        acc.cogs += t.costOfGoodsSold || 0;
        return acc;
    }, { revenue: 0, cogs: 0 });
    const profit = totals.revenue - totals.cogs;

    const handleExport = () => {
        const data = filteredTransactions.map(t => ({
            Date: format(new Date(t.date), 'yyyy-MM-dd'),
            Farmer: t.userName,
            Description: t.inventoryItemName || t.description,
            Revenue: t.amount,
            COGS: t.costOfGoodsSold || 0,
            Profit: t.amount - (t.costOfGoodsSold || 0)
        }));
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `sales-report-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Exported!", description: "Sales report has been downloaded as CSV."});
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <CardTitle>Sales Report</CardTitle>
                        <CardDescription>Analyze your sales revenue, costs, and profit over a period.</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                         <DateRangePicker 
                            className="max-w-md mx-auto"
                            value={dateRange} 
                            onValueChange={setDateRange}
                        />
                        <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredTransactions.length === 0}>
                            <Download className="mr-2 h-4 w-4" /> Export
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-80 w-full" />
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
                            <Card>
                                <CardHeader><CardTitle className="text-green-500">Total Revenue</CardTitle></CardHeader>
                                <CardContent><p className="text-2xl font-bold">₹{totals.revenue.toLocaleString()}</p></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="text-red-500">Total Costs (COGS)</CardTitle></CardHeader>
                                <CardContent><p className="text-2xl font-bold">₹{totals.cogs.toLocaleString()}</p></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="text-primary">Gross Profit</CardTitle></CardHeader>
                                <CardContent><p className="text-2xl font-bold">₹{profit.toLocaleString()}</p></CardContent>
                            </Card>
                        </div>

                        {filteredTransactions.length === 0 ? (
                             <div className="flex flex-col items-center justify-center text-center py-16">
                                <p className="text-muted-foreground">No sales data found for the selected period.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Farmer</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">COGS</TableHead>
                                        <TableHead className="text-right">Profit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell>{format(new Date(t.date), 'dd MMM, yyyy')}</TableCell>
                                            <TableCell>{t.userName}</TableCell>
                                            <TableCell>{t.inventoryItemName}</TableCell>
                                            <TableCell className="text-right">₹{t.amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">₹{(t.costOfGoodsSold || 0).toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-medium">₹{(t.amount - (t.costOfGoodsSold || 0)).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
