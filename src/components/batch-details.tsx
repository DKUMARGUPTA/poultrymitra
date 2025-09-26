import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, MoreVertical, IndianRupee } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import type { Batch } from "@/services/batches.service";
import { differenceInDays, format } from 'date-fns';
import { AddDailyEntryModal } from './add-daily-entry-modal';
import { DailyEntry, getDailyEntriesForBatch } from '@/services/daily-entries.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Skeleton } from './ui/skeleton';
import { EditBatchModal } from './edit-batch-modal';
import { DeleteBatchAlert } from './delete-batch-alert';
import Link from 'next/link';
import { LogSaleModal } from './log-sale-modal';
import { Transaction, getTransactionsForBatch } from '@/services/transactions.service';
import { db } from '@/lib/firebase';

interface BatchDetailsProps {
    batch: Batch;
    onBatchDeleted: (batchId: string) => void;
    onBatchUpdated: (updatedBatch: Batch) => void;
}

export function BatchDetails({ batch, onBatchDeleted, onBatchUpdated }: BatchDetailsProps) {
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  useEffect(() => {
    if (!db) return;
    setLoadingEntries(true);
    const unsubscribeEntries = getDailyEntriesForBatch(batch.id, (entries) => {
        setDailyEntries(entries);
        setLoadingEntries(false);
    });
     const unsubscribeTransactions = getTransactionsForBatch(batch.id, (trans) => {
        setTransactions(trans);
    });


    return () => {
      unsubscribeEntries();
      unsubscribeTransactions();
    }
  }, [batch.id, db]);

  const handleEntryAdded = (newEntry: DailyEntry) => {
    // The onSnapshot listener in getDailyEntriesForBatch will automatically update the state.
  };
  
  const handleBatchUpdated = (updatedBatchData: Partial<Batch>) => {
    onBatchUpdated({ ...batch, ...updatedBatchData });
  };

  const handleSaleLogged = () => {
    // Data will refresh via the snapshot listener
  }

  const cycleDuration = 42; // days
  const batchAge = differenceInDays(new Date(), new Date(batch.startDate));
  const progress = Math.min((batchAge / cycleDuration) * 100, 100);

  const totalMortality = dailyEntries.reduce((sum, entry) => sum + entry.mortality, 0);
  const birdsSold = transactions.filter(t => t.description.includes('Sale of birds')).reduce((sum, t) => sum + (t.quantitySold || 0), 0);
  const currentBirdCount = batch.initialBirdCount - totalMortality - birdsSold;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
            <div>
                <CardTitle className="font-headline">{batch.name}</CardTitle>
                <CardDescription>Started on: {new Date(batch.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <AddDailyEntryModal batchId={batch.id} batchStartDate={batch.startDate} onEntryAdded={handleEntryAdded}>
                    <Button>Add Daily Entry</Button>
                </AddDailyEntryModal>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <LogSaleModal batch={batch} currentBirdCount={currentBirdCount} onSaleLogged={handleSaleLogged}>
                         <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <IndianRupee className="mr-2 h-4 w-4" />
                            Log Sale
                        </DropdownMenuItem>
                    </LogSaleModal>
                    <EditBatchModal batch={batch} onBatchUpdated={handleBatchUpdated}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit Batch</DropdownMenuItem>
                    </EditBatchModal>
                    <DropdownMenuItem asChild>
                        <Link href="/ledger">View Ledger</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Mark as Complete</DropdownMenuItem>
                    <DeleteBatchAlert batch={batch} onBatchDeleted={() => onBatchDeleted(batch.id)}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Delete Batch</DropdownMenuItem>
                    </DeleteBatchAlert>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
                <p className="text-2xl font-bold">{currentBirdCount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Active Birds</p>
            </div>
            <div>
                <p className="text-2xl font-bold">{totalMortality.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Mortality</p>
            </div>
            <div>
                <p className="text-2xl font-bold">{batchAge} Days</p>
                <p className="text-sm text-muted-foreground">Batch Age</p>
            </div>
            <div>
                <p className="text-2xl font-bold">Healthy</p>
                <Badge variant="secondary" className="border-green-500/50 text-green-700">Good</Badge>
            </div>
        </div>
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Growth Cycle</span>
                <span className="text-sm font-medium text-muted-foreground">Day {batchAge} of {cycleDuration}</span>
            </div>
            <Progress value={progress} className="w-full" />
             <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
                <Flame className="w-4 h-4 mr-1 text-orange-500" />
                <span>Next growth phase: Finisher Feed</span>
            </div>
        </div>
         <div>
            <h4 className="text-md font-medium mb-2 font-headline">Recent Daily Entries</h4>
            {loadingEntries ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : dailyEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No daily entries recorded yet.</p>
            ) : (
                 <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-center">Mortality</TableHead>
                                <TableHead className="text-center">Feed (Kg)</TableHead>
                                <TableHead className="text-center">Avg. Wt (g)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dailyEntries.slice(0, 5).map(entry => (
                                <TableRow key={entry.id}>
                                    <TableCell>{format(new Date(entry.date), 'MMM dd')}</TableCell>
                                    <TableCell className="text-center">{entry.mortality}</TableCell>
                                    <TableCell className="text-center">{entry.feedConsumedInKg}</TableCell>
                                    <TableCell className="text-center">{entry.averageWeightInGrams}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
