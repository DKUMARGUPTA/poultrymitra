
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Loader, PlusCircle, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { createMarketRatesInBatch, BirdSize, createMarketRate } from '@/services/market-rates.service';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { indianStates } from '@/lib/indian-states';
import { useUser, useFirebase } from '@/firebase';

const AddRateFormSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
  state: z.string().min(1, "State is required."),
  district: z.string().min(1, "District is required."),
  rateSmall: z.number().min(0).optional(),
  rateMedium: z.number().min(0).optional(),
  rateBig: z.number().min(0).optional(),
}).refine(data => data.rateSmall || data.rateMedium || data.rateBig, {
    message: "At least one rate must be provided.",
    path: ["rateSmall"], // assign error to the first field
});

type AddRateFormValues = z.infer<typeof AddRateFormSchema>;

interface AddMarketRateModalProps {
  children: React.ReactNode;
  onRateAdded: () => void;
  initialData?: {
    date: string;
    state: string;
    district: string;
    size?: BirdSize;
  }
}

export function AddMarketRateModal({ children, onRateAdded, initialData }: AddMarketRateModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useUser();
  const { db } = useFirebase();
  
  const form = useForm<AddRateFormValues>({
    resolver: zodResolver(AddRateFormSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      state: '',
      district: '',
      rateSmall: 0,
      rateMedium: 0,
      rateBig: 0,
    },
  });

  const selectedState = form.watch('state');
  
  const hasAllStatesPermission = useMemo(() => 
    userProfile?.ratePermissions?.some(p => p.state === 'ALL') || userProfile?.role === 'admin'
  , [userProfile]);

  const permittedStates = useMemo(() => {
    if (hasAllStatesPermission) return indianStates;
    const permittedStateNames = userProfile?.ratePermissions?.map(p => p.state) || [];
    return indianStates.filter(s => permittedStateNames.includes(s.name));
  }, [userProfile, hasAllStatesPermission]);

  const permittedDistricts = useMemo(() => {
    if (!selectedState) return [];
    if (hasAllStatesPermission) {
      return indianStates.find(s => s.name === selectedState)?.districts || [];
    }
    const statePermission = userProfile?.ratePermissions?.find(p => p.state === selectedState);
    if (statePermission?.districts.includes('ALL')) {
      return indianStates.find(s => s.name === selectedState)?.districts || [];
    }
    return statePermission?.districts || [];
  }, [selectedState, userProfile, hasAllStatesPermission]);

  
  useEffect(() => {
    if (open && initialData) {
      form.reset({
        date: initialData.date,
        state: initialData.state,
        district: initialData.district,
        rateSmall: 0,
        rateMedium: 0,
        rateBig: 0,
      });
    }
  }, [open, initialData, form]);

  useEffect(() => {
    if(!initialData?.district){ // Prevent resetting district if it's pre-filled
       form.setValue('district', '');
    }
  }, [selectedState, form, initialData]);

  const handleSubmit = async (values: AddRateFormValues) => {
    if (!userProfile || !db) return;
    setLoading(true);
    try {
        const ratesToCreate: { size: BirdSize, rate: number }[] = [];
        if (values.rateSmall && values.rateSmall > 0) ratesToCreate.push({ size: 'Small', rate: values.rateSmall });
        if (values.rateMedium && values.rateMedium > 0) ratesToCreate.push({ size: 'Medium', rate: values.rateMedium });
        if (values.rateBig && values.rateBig > 0) ratesToCreate.push({ size: 'Big', rate: values.rateBig });

        const batchData = ratesToCreate.map(r => ({
            date: values.date,
            state: values.state,
            district: values.district,
            size: r.size,
            rate: r.rate,
        }));
        
        await createMarketRatesInBatch(db, batchData, userProfile.role as 'admin' | 'dealer', userProfile.uid);
      
      toast({
        title: 'Market Rates Added',
        description: `The rates for ${values.district} have been successfully added.`,
      });
      onRateAdded();
      handleOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add market rates. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        state: '',
        district: '',
        rateSmall: 0,
        rateMedium: 0,
        rateBig: 0,
      });
    }
  };

  const isPrefilled = !!initialData;
  const singleSize = initialData?.size;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            {isPrefilled ? `Add Rate for ${initialData.district}` : 'Add New Market Rate'}
          </DialogTitle>
          <DialogDescription>
            Enter the daily broiler rate details for a specific region.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} disabled={isPrefilled}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {permittedStates.map(state => <SelectItem key={state.name} value={state.name}>{state.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isPrefilled || !selectedState}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a district" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {permittedDistricts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                           disabled={isPrefilled}
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
                 <FormField
                    control={form.control}
                    name="rateSmall"
                    render={({ field }) => (
                        <FormItem className={cn(singleSize && singleSize !== 'Small' && 'hidden')}>
                        <FormLabel>Rate (Small)</FormLabel>
                        <FormControl>
                            <Input 
                            type="number"
                            step="any"
                            placeholder="e.g., 90" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="rateMedium"
                    render={({ field }) => (
                        <FormItem className={cn(singleSize && singleSize !== 'Medium' && 'hidden')}>
                        <FormLabel>Rate (Medium)</FormLabel>
                        <FormControl>
                            <Input 
                            type="number"
                            step="any"
                            placeholder="e.g., 95.5" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="rateBig"
                    render={({ field }) => (
                        <FormItem className={cn(singleSize && singleSize !== 'Big' && 'hidden')}>
                        <FormLabel>Rate (Big)</FormLabel>
                        <FormControl>
                            <Input 
                            type="number"
                            step="any"
                            placeholder="e.g., 100" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader className="animate-spin mr-2" /> Saving...</> : 'Save Rates'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
