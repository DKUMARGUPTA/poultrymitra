
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Loader, Edit, TrendingUp, IndianRupee } from 'lucide-react';
import { MarketRate, updateMarketRate } from '@/services/market-rates.service';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from './ui/input';

const EditRateSchema = z.object({
  rate: z.number().min(0, "Rate must be a positive number."),
});
type EditRateFormValues = z.infer<typeof EditRateSchema>;

interface EditMarketRateModalProps {
  children: React.ReactNode;
  rate: MarketRate;
  onRateUpdated: (rate: MarketRate) => void;
}

export function EditMarketRateModal({ children, rate, onRateUpdated }: EditMarketRateModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditRateFormValues>({
    resolver: zodResolver(EditRateSchema),
    defaultValues: {
      rate: rate.rate,
    },
  });

  const handleSubmit = async (values: EditRateFormValues) => {
    setLoading(true);
    try {
      await updateMarketRate(rate.id, values.rate);
      toast({
        title: 'Rate Updated',
        description: `The rate for ${rate.district} has been updated.`,
      });
      onRateUpdated({ ...rate, ...values });
      handleOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update rate. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset({ rate: rate.rate });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Edit Rate
          </DialogTitle>
          <DialogDescription>
            Update the rate for {rate.size} birds in {rate.district}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Rate</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                        type="number"
                        step="any"
                        placeholder="e.g., 95.5"
                        className="pl-8"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader className="animate-spin mr-2" /> Saving...</> : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
