
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
import { deleteOrder, Order } from "@/services/orders.service";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface CancelOrderAlertProps {
    order: Order;
    onOrderCancelled: () => void;
    children: React.ReactNode;
}

export function CancelOrderAlert({ order, onOrderCancelled, children }: CancelOrderAlertProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCancel = async () => {
    setLoading(true);
    try {
        await deleteOrder(order.id);
        onOrderCancelled();
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Cancellation Failed",
            description: error.message || `Could not cancel the order. Please try again.`
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
          <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently cancel your order #{order.id.substring(0,6)}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Go Back</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} asChild>
            <Button variant="destructive" disabled={loading}>
              {loading ? 'Cancelling...' : 'Yes, Cancel Order'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
