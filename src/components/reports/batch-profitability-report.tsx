
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getBatchesByFarmer, Batch } from '@/services/batches.service';
import { getTransactionsForBatch } from '@/services/transactions.service';
import { getDailyEntriesForBatch } from '@/services/daily-entries.service';
import { Skeleton } from '../ui/skeleton';
import { DonutChart, BarChart, Title } from "@tremor/react";
import { format } from 'date-fns';

type ReportData = {
    revenue: number;
    cogs: number;
    profit: number;
    fcr: number;
    mortalityRate: number;
    costBreakdown: { name: string; value: number }[];
};

export function BatchProfitabilityReport() {
    const { user } = useAuth();
    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            getBatchesByFarmer(user.uid, setBatches);
        }
    }, [user]);

    useEffect(() => {
        const generateReport = async () => {
            if (!selectedBatchId) {
                setReportData(null);
                return;
            }
            setLoading(true);

            const batch = batches.find(b => b.id === selectedBatchId);
            if (!batch) {
                setLoading(false);
                return;
            }

            const transactions = await getTransactionsForBatch(batch.id);
            const entries = await getDailyEntriesForBatch(batch.id, () => {});

            const revenue = Math.abs(transactions.filter(t => t.description.toLowerCase().includes('sale')).reduce((sum, t) => sum + t.amount, 0));
            const cogs = transactions.filter(t => t.costOfGoodsSold).reduce((sum, t) => sum + t.costOfGoodsSold!, 0);

            const costBreakdown = transactions
                .filter(t => t.costOfGoodsSold)
                .reduce((acc, t) => {
                    const name = t.inventoryItemName || 'Uncategorized';
                    const existing = acc.find(item => item.name === name);
                    if (existing) {
                        existing.value += t.costOfGoodsSold!;
                    } else {
                        acc.push({ name, value: t.costOfGoodsSold! });
                    }
                    return acc;
                }, [] as { name: string, value: number }[]);
            
            // Calculate FCR and Mortality
            const totalMortality = entries.reduce((sum, entry) => sum + entry.mortality, 0);
            const totalFeedConsumed = entries.reduce((sum, entry) => sum + entry.feedConsumedInKg, 0);
            const finalBirdCount = batch.initialBirdCount - totalMortality;
            const mortalityRate = (totalMortality / batch.initialBirdCount) * 100;
            
            const totalWeightSold = transactions.filter(t => t.description.toLowerCase().includes('sale')).reduce((sum, t) => sum + (t.totalWeight || 0), 0);
            
            const fcr = totalWeightSold > 0 ? totalFeedConsumed / totalWeightSold : 0;
            
            setReportData({
                revenue,
                cogs,
                profit: revenue - cogs,
                fcr,
                mortalityRate,
                costBreakdown
            });

            setLoading(false);
        };

        generateReport();
    }, [selectedBatchId, batches]);

    const valueFormatter = (number: number) => `₹${new Intl.NumberFormat("en-IN").format(number).toString()}`;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Batch Profitability Report</CardTitle>
                <CardDescription>Select a batch to see a detailed breakdown of revenue, costs, and profit.</CardDescription>
                <div className="w-full max-w-sm pt-4">
                     <Select onValueChange={setSelectedBatchId} value={selectedBatchId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a batch" />
                        </SelectTrigger>
                        <SelectContent>
                            {batches.map(b => (
                                <SelectItem key={b.id} value={b.id}>
                                    {b.name} - Started {format(new Date(b.startDate), 'MMM yyyy')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </div>
                ) : !reportData ? (
                    <div className="flex flex-col items-center justify-center text-center py-16">
                        <p className="text-muted-foreground">Please select a batch to generate a report.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 text-center">
                            <Card>
                                <CardHeader><CardTitle className="text-green-500">Revenue</CardTitle></CardHeader>
                                <CardContent><p className="text-3xl font-bold">{valueFormatter(reportData.revenue)}</p></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="text-red-500">Costs (COGS)</CardTitle></CardHeader>
                                <CardContent><p className="text-3xl font-bold">{valueFormatter(reportData.cogs)}</p></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="text-primary">Net Profit</CardTitle></CardHeader>
                                <CardContent><p className="text-3xl font-bold">{valueFormatter(reportData.profit)}</p></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="text-blue-500">FCR</CardTitle></CardHeader>
                                <CardContent><p className="text-3xl font-bold">{reportData.fcr.toFixed(2)}</p></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="text-orange-500">Mortality</CardTitle></CardHeader>
                                <CardContent><p className="text-3xl font-bold">{reportData.mortalityRate.toFixed(2)}%</p></CardContent>
                            </Card>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                             <div>
                                <Title>Cost Breakdown</Title>
                                <DonutChart
                                    className="mt-6"
                                    data={reportData.costBreakdown}
                                    category="value"
                                    index="name"
                                    valueFormatter={valueFormatter}
                                    colors={["green", "blue", "orange", "purple", "red", "yellow"]}
                                />
                             </div>
                             <div>
                                <Title>Revenue vs. Cost</Title>
                                <BarChart
                                    className="mt-6"
                                    data={[{ name: "Summary", Revenue: reportData.revenue, Costs: reportData.cogs, Profit: reportData.profit }]}
                                    index="name"
                                    categories={["Revenue", "Costs", "Profit"]}
                                    colors={["green", "red", "blue"]}
                                    valueFormatter={valueFormatter}
                                    yAxisWidth={60}
                                />
                             </div>
                         </div>

                    </div>
                )}
            </CardContent>
        </Card>
    )
}
