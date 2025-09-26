
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
import { Loader, ClipboardList, Calendar as CalendarIcon } from 'lucide-react';
import { createDailyEntry, DailyEntrySchema, DailyEntry } from '@/services/daily-entries.service';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { Textarea } from './ui/textarea';

const AddDailyEntryFormSchema = DailyEntrySchema.omit({ batchId: true, createdAt: true });
type AddDailyEntryFormValues = z.infer<typeof AddDailyEntryFormSchema>;

interface AddDailyEntryModalProps {
  children: React.ReactNode;
  batchId: string;
  batchStartDate: string;
  onEntryAdded: (entry: DailyEntry) => void;
}

export function AddDailyEntryModal({ children, batchId, batchStartDate, onEntryAdded }: AddDailyEntryModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddDailyEntryFormValues>({
    resolver: zodResolver(AddDailyEntryFormSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      mortality: 0,
      feedConsumedInKg: 0,
      averageWeightInGrams: 0,
      notes: '',
    },
  });

  const handleSubmit = async (values: AddDailyEntryFormValues) => {
    setLoading(true);

    try {
      const entryInput = {
        ...values,
        batchId: batchId,
      };
      const entryId = await createDailyEntry(entryInput);
      const newEntry: DailyEntry = {
        id: entryId,
        ...entryInput,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } // optimistic update
      }
      
      toast({
        title: 'Daily Entry Added',
        description: `Entry for ${format(new Date(values.date), "PPP")} has been saved.`,
      });
      onEntryAdded(newEntry);
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add entry. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Add Daily Entry
          </DialogTitle>
          <DialogDescription>
            Record daily statistics for your batch. Be as accurate as possible.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Record</FormLabel>
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
                          date > new Date() || date < new Date(batchStartDate)
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
                    name="mortality"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Mortality</FormLabel>
                        <FormControl>
                            <Input 
                            type="number" 
                            placeholder="e.g., 5" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="feedConsumedInKg"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Feed Used (Kg)</FormLabel>
                        <FormControl>
                            <Input 
                            type="number"
                            step="any"
                            placeholder="e.g., 15.5" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="averageWeightInGrams"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Average Weight (grams)</FormLabel>
                    <FormControl>
                        <Input 
                        type="number" 
                        placeholder="e.g., 250" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                       <Textarea placeholder="Any observations about bird health, behavior, etc." {...field} />
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
                {loading ? <><Loader className="animate-spin mr-2" /> Saving...</> : 'Save Entry'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
