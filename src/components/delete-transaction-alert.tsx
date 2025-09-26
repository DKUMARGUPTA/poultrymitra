
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteTransaction, Transaction } from "@/services/transactions.service";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface DeleteTransactionAlertProps {
    transaction: Transaction;
    onTransactionDeleted: (id: string) => void;
    children: React.ReactNode;
}

export function DeleteTransactionAlert({ transaction, onTransactionDeleted, children }: DeleteTransactionAlertProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    try {
        await deleteTransaction(transaction.id);
        onTransactionDeleted(transaction.id);
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: error.message || `Could not delete the transaction. Please try again.`
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this transaction and reverse any associated inventory or balance changes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} asChild>
            <Button variant="destructive" disabled={loading}>
              {loading ? 'Deleting...' : 'Yes, delete transaction'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
