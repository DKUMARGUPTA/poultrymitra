
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
import { deleteBatch, Batch } from "@/services/batches.service";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface DeleteBatchAlertProps {
    batch: Batch;
    onBatchDeleted: () => void;
    children: React.ReactNode;
}

export function DeleteBatchAlert({ batch, onBatchDeleted, children }: DeleteBatchAlertProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    try {
        await deleteBatch(batch.id);
        toast({
            title: "Batch Deleted",
            description: `${batch.name} and all its entries have been removed.`,
        });
        onBatchDeleted();
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: `Could not delete ${batch.name}. Please try again.`
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
            This action cannot be undone. This will permanently delete the batch <span className="font-bold">{batch.name}</span> and all of its associated daily entries.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} asChild>
            <Button variant="destructive" disabled={loading}>
              {loading ? 'Deleting...' : 'Yes, delete batch'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
