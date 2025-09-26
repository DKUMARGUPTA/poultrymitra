
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, subDays } from 'date-fns';
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
import { Loader, IndianRupee, Calendar as CalendarIcon, Weight, Bird } from 'lucide-react';
import { createTransaction } from '@/services/transactions.service';
import { useAuth } from '@/hooks/use-auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import type { Batch } from '@/services/batches.service';

const LogSaleFormSchema = z.object({
  date: z.date(),
  quantitySold: z.number().min(1, "Must sell at least one bird."),
  totalWeight: z.number().min(0.1, "Total weight is required."),
  ratePerKg: z.number().min(1, "Rate per kg must be positive."),
  buyerName: z.string().min(1, "Buyer name is required."),
});
type LogSaleFormValues = z.infer<typeof LogSaleFormSchema>;

interface LogSaleModalProps {
  children: React.ReactNode;
  batch: Batch;
  currentBirdCount: number;
  onSaleLogged: () => void;
}

export function LogSaleModal({ children, batch, currentBirdCount, onSaleLogged }: LogSaleModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const form = useForm<LogSaleFormValues>({
    resolver: zodResolver(LogSaleFormSchema),
    defaultValues: {
      date: new Date(),
      quantitySold: currentBirdCount,
      totalWeight: 0,
      ratePerKg: 0,
      buyerName: '',
    },
  });

  const handleSubmit = async (values: LogSaleFormValues) => {
    if (!user || !userProfile || !userProfile.dealerCode) {
      toast({ variant: 'destructive', title: 'Error', description: 'User or dealer information is missing.' });
      return;
    }
    setLoading(true);

    try {
      const totalAmount = values.totalWeight * values.ratePerKg;

      await createTransaction({
        date: values.date,
        description: `Sale of ${values.quantitySold} birds from batch ${batch.name}`,
        amount: -totalAmount, // Negative amount because it's revenue for the farmer (credit), so it DECREASES their outstanding balance with the dealer
        status: 'Paid', // Sales are typically cash transactions for the ledger
        userId: user.uid,
        userName: userProfile.name,
        dealerId: userProfile.dealerCode,
        batchId: batch.id,
        quantitySold: values.quantitySold,
        totalWeight: values.totalWeight,
        paymentMethod: 'Cash' // Default for bird sales
      });

      toast({
        title: 'Sale Logged',
        description: `Sale of ₹${totalAmount.toLocaleString()} has been recorded.`,
      });
      onSaleLogged();
      handleOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Logging Sale',
        description: error.message || 'An unexpected error occurred.',
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
        quantitySold: currentBirdCount,
        totalWeight: 0,
        ratePerKg: 0,
        buyerName: '',
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
            Log Sale for {batch.name}
          </DialogTitle>
          <DialogDescription>
            Record the details of a bird sale from this batch. This will update your ledger.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Sale</FormLabel>
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
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date(batch.startDate)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="quantitySold"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-1"><Bird className="w-4 h-4"/> Birds Sold</FormLabel>
                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} max={currentBirdCount} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                 <FormField
                    control={form.control}
                    name="totalWeight"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-1"><Weight className="w-4 h-4"/> Total Weight (kg)</FormLabel>
                            <FormControl><Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="ratePerKg"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Rate per Kg (₹)</FormLabel>
                        <FormControl><Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                />
             <FormField
                control={form.control}
                name="buyerName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Buyer Name</FormLabel>
                        <FormControl><Input placeholder="e.g., Local Market Trader" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader className="animate-spin mr-2" /> Logging Sale...</> : 'Log Sale'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
