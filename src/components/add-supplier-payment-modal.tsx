
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader, IndianRupee, Calendar as CalendarIcon } from 'lucide-react';
import { createTransaction, Transaction, TransactionInput } from '@/services/transactions.service';
import { useUser } from '@/firebase';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

const AddPaymentFormSchema = z.object({
  date: z.date(),
  description: z.string().min(1),
  amount: z.number().min(0.01),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Credit', 'UPI', 'RTGS', 'NEFT']),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
});
type AddPaymentFormValues = z.infer<typeof AddPaymentFormSchema>;

interface AddSupplierPaymentModalProps {
  children: React.ReactNode;
  supplierName: string;
  onPaymentAdded: (transaction: Transaction) => void;
}

export function AddSupplierPaymentModal({ children, supplierName, onPaymentAdded }: AddSupplierPaymentModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<AddPaymentFormValues>({
    resolver: zodResolver(AddPaymentFormSchema),
    defaultValues: {
      date: new Date(),
      description: `Payment to ${supplierName}`,
      amount: undefined,
      paymentMethod: 'Bank Transfer',
      referenceNumber: '',
      remarks: '',
    },
  });

  const paymentMethod = form.watch('paymentMethod');

  const handleSubmit = async (values: AddPaymentFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    setLoading(true);

    try {
      const transactionInput: TransactionInput = {
        date: values.date,
        description: values.description,
        amount: -Math.abs(values.amount), // Payment TO supplier is a negative amount for the dealer
        status: 'Paid',
        userId: user.uid, // The dealer is the user in this context
        userName: supplierName, // We store the supplier name here
        dealerId: user.uid, // The dealer is also the dealer
        paymentMethod: values.paymentMethod,
        referenceNumber: values.referenceNumber,
        remarks: values.remarks,
        isBusinessExpense: true,
      };

      await createTransaction(transactionInput);

      toast({
        title: 'Payment Added',
        description: `Payment to ${supplierName} has been logged.`,
      });
      onPaymentAdded({ id: 'temp-id', ...transactionInput, date: transactionInput.date.toISOString() });
      handleOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to log payment.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset({
        date: new Date(),
        description: `Payment to ${supplierName}`,
        amount: undefined,
        paymentMethod: 'Bank Transfer',
        referenceNumber: '',
        remarks: '',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-primary" />
            Add Payment to {supplierName}
          </DialogTitle>
          <DialogDescription>
            Log a payment you made to this supplier.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Paid</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 50000"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UTR / Reference Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter transaction ID" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="RTGS">RTGS</SelectItem>
                      <SelectItem value="NEFT">NEFT</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer (Other)</SelectItem>
                      <SelectItem value="Credit">Internal Credit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {paymentMethod === 'Cash' && (
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add a note for this cash transaction..." {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
             <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => field.onChange(date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader className="animate-spin mr-2" /> Logging...</> : 'Log Payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
