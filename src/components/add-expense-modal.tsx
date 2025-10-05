
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader, Wallet, Calendar as CalendarIcon } from 'lucide-react';
import { createTransaction, Transaction, TransactionInput } from '@/services/transactions.service';
import { useUser, useFirebase } from '@/firebase';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

const AddExpenseFormSchema = z.object({
  date: z.date(),
  paidTo: z.string().min(1, "Recipient name is required."),
  description: z.string().min(1, "A description is required."),
  amount: z.number().min(0.01, "Amount must be greater than zero."),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'UPI', 'RTGS', 'NEFT']),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
});
type AddExpenseFormValues = z.infer<typeof AddExpenseFormSchema>;

interface AddExpenseModalProps {
  children: React.ReactNode;
  onExpenseAdded: (transaction: Transaction) => void;
}

export function AddExpenseModal({ children, onExpenseAdded }: AddExpenseModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, userProfile } = useUser();
  const { db } = useFirebase();

  const form = useForm<AddExpenseFormValues>({
    resolver: zodResolver(AddExpenseFormSchema),
    defaultValues: {
      date: new Date(),
      paidTo: '',
      description: '',
      amount: undefined,
      paymentMethod: 'UPI',
      referenceNumber: '',
      remarks: '',
    },
  });

  const handleSubmit = async (values: AddExpenseFormValues) => {
    if (!user || !userProfile || !db) {
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }
    setLoading(true);

    try {
      const transactionInput: TransactionInput = {
        date: values.date,
        description: values.description,
        amount: -Math.abs(values.amount), // Expenses are negative
        status: 'Paid',
        userId: user.uid, // The user themselves
        userName: values.paidTo, // We store the recipient here
        dealerId: userProfile.role === 'dealer' ? user.uid : userProfile.dealerCode || '',
        paymentMethod: values.paymentMethod,
        referenceNumber: values.referenceNumber,
        remarks: values.remarks,
        isBusinessExpense: true,
      };

      await createTransaction(db, transactionInput);

      toast({
        title: 'Expense Logged',
        description: `Your expense has been recorded.`,
      });
      onExpenseAdded({ id: 'temp-id', ...transactionInput, date: transactionInput.date.toISOString() });
      handleOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to log expense.',
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
          paidTo: '',
          description: '',
          amount: undefined,
          paymentMethod: 'UPI',
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
            <Wallet className="w-6 h-6 text-primary" />
            Log a Business Expense
          </DialogTitle>
          <DialogDescription>
            Record an operational cost like rent, utilities, or salary.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="paidTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid To</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Transport Co., Labour Contractor" {...field} />
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
                  <FormLabel>Expense Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Office Rent, Electricity Bill" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Paid</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 15000"
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UTR / Reference (Optional)</FormLabel>
                  <FormControl><Input placeholder="Enter transaction ID" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Expense</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader className="animate-spin mr-2" /> Logging...</> : 'Log Expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
