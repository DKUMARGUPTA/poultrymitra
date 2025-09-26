
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import {
  Transaction,
  getTransactionsForUser,
  getAllTransactions,
} from '@/services/transactions.service';
import { format } from 'date-fns';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TransactionHistoryProps {
  scope?: 'user' | 'all' | 'dealer';
}

export function TransactionHistory({ scope = 'user' }: TransactionHistoryProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let fetchedTransactions: Transaction[] = [];
        if (scope === 'all') {
          fetchedTransactions = await getAllTransactions();
        } else if (user) {
          fetchedTransactions = await getTransactionsForUser(user.uid, scope === 'dealer');
        }
        setTransactions(fetchedTransactions);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        // Handle error appropriately, maybe with a toast
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, scope]);
  
  if (loading) {
    return (
        <div className="mt-4 border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    {scope === 'all' && <TableHead className="hidden sm:table-cell">User</TableHead>}
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            {scope === 'all' && <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>}
                            <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
  }

  return (
    <div className="w-full">
      {transactions.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[200px]">
            <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">No transactions yet</h3>
                <p className="text-sm text-muted-foreground">Your recent transactions will appear here.</p>
            </div>
        </div>
      ) : (
      <div className="mt-4 border rounded-lg">
        <TooltipProvider>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                {scope === 'all' && <TableHead className="hidden sm:table-cell">User</TableHead>}
                <TableHead className="hidden sm:table-cell">Method</TableHead>
                <TableHead className="hidden md:table-cell">Ref / Order ID</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                    <TableCell>
                    <div className="font-medium">{format(new Date(transaction.date), "dd/MM/yy, p")}</div>
                    </TableCell>
                    <TableCell>
                    <div className="font-medium">{transaction.description}</div>
                    {transaction.inventoryItemName && (
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
                    {scope === 'all' && (
                      <TableCell className="hidden sm:table-cell">
                        {transaction.userName}
                      </TableCell>
                    )}
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {transaction.paymentMethod}
                    </TableCell>
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
                        <Tooltip>
                            <TooltipTrigger>
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
                            </TooltipTrigger>
                            {transaction.status === 'Pending' && (
                                <TooltipContent>
                                    <p>This amount is due to be paid.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TableCell>
                    <TableCell className={`text-right font-medium`}>
                    <div className={`${transaction.amount >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {transaction.amount < 0 ? `-₹${Math.abs(transaction.amount).toLocaleString()}` : `+₹${transaction.amount.toLocaleString()}`}
                    </div>
                    {(transaction.costOfGoodsSold ?? 0) > 0 && (
                        <div className="text-xs text-muted-foreground">
                        (Cost: ₹{transaction.costOfGoodsSold!.toLocaleString()})
                        </div>
                    )}
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </TooltipProvider>
      </div>
      )}
    </div>
  );
}
