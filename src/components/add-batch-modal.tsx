
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
import { Loader, PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { createBatch, BatchSchema, Batch } from '@/services/batches.service';
import { useUser } from '@/firebase';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { BatchInput } from '@/services/batches.service';

const AddBatchFormSchema = BatchSchema.omit({ farmerId: true, createdAt: true });
type AddBatchFormValues = z.infer<typeof AddBatchFormSchema>;

interface AddBatchModalProps {
  children: React.ReactNode;
  onBatchAdded: (batch: Batch) => void;
  onNewBatchClick?: () => boolean;
}

export function AddBatchModal({ children, onBatchAdded, onNewBatchClick }: AddBatchModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<AddBatchFormValues>({
    resolver: zodResolver(AddBatchFormSchema),
    defaultValues: {
      name: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      initialBirdCount: 100,
    },
  });

  const handleSubmit = async (values: AddBatchFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to add a batch.',
      });
      return;
    }

    setLoading(true);

    try {
      const batchInput: Omit<BatchInput, 'createdAt'> = {
        ...values,
        farmerId: user.uid,
      };
      const batchId = await createBatch(batchInput);
      const newBatch: Batch = {
        id: batchId,
        ...batchInput,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } // optimistic update
      }
      
      toast({
        title: 'Batch Added',
        description: `${values.name} has been successfully created.`,
      });
      onBatchAdded(newBatch);
      setOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add batch. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && onNewBatchClick) {
        if (!onNewBatchClick()) {
            return; // Don't open the modal if the check fails
        }
    }
    setOpen(isOpen);
    if (!isOpen) {
        form.reset();
    }
  }


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-primary" />
            Create a New Batch
          </DialogTitle>
          <DialogDescription>
            Enter the details for your new poultry batch to start tracking.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Broiler Batch #12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
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
                            format(new Date(field.value), "PPP")
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
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="initialBirdCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Bird Count</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g., 500" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader className="animate-spin mr-2" /> Creating...</> : 'Create Batch'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
