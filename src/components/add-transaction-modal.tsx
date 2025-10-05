

'use client';

import { useEffect, useState } from 'react';
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
import { createTransaction, TransactionSchema, Transaction, TransactionInput } from '@/services/transactions.service';
import { useFirebase, useUser } from '@/firebase';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getUserProfile, UserProfile } from '@/services/users.service';
import { Farmer, getFarmersByDealer, getFarmer } from '@/services/farmers.service';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { InventoryItem, getInventoryItems } from '@/services/inventory.service';
import { Textarea } from './ui/textarea';
import { db } from '@/lib/firebase';

const AddTransactionFormSchema = TransactionSchema.omit({ userId: true, userName: true, dealerId: true, costOfGoodsSold: true, inventoryItemName: true });
type AddTransactionFormValues = z.infer<typeof AddTransactionFormSchema> & { associatedUserId?: string };

interface AddTransactionModalProps {
  children: React.ReactNode;
  onTransactionAdded: (transaction: Transaction) => void;
  farmerId?: string;
}

export function AddTransactionModal({ children, onTransactionAdded, farmerId }: AddTransactionModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, userProfile } = useUser();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (user && db && open && userProfile?.role === 'dealer') {
        setDataLoading(true);
        const unsubFarmers = getFarmersByDealer(user.uid, setFarmers);
        
        if (farmerId) {
            getFarmer(farmerId).then(setSelectedFarmer);
        }
        setDataLoading(false);
        return () => {
            unsubFarmers();
        };
    } else {
        setDataLoading(false);
    }
  }, [open, user, userProfile, farmerId, db]);

  const form = useForm<AddTransactionFormValues>({
    resolver: zodResolver(AddTransactionFormSchema.extend({ associatedUserId: z.string().optional() })),
    defaultValues: {
      date: new Date(),
      description: 'Payment received',
      status: 'Paid',
      amount: 0,
      associatedUserId: farmerId,
      inventoryItemId: '',
      quantitySold: 0,
      paymentMethod: 'Cash',
      referenceNumber: '',
      remarks: '',
    },
  });

  const paymentMethod = form.watch('paymentMethod');

  useEffect(() => {
    if (farmerId) {
        form.setValue('associatedUserId', farmerId);
    }
  }, [farmerId, form]);


  const handleSubmit = async (values: AddTransactionFormValues) => {
    if (!user || !userProfile || !db) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to add a transaction.' });
      return;
    }

    setLoading(true);
    
    try {
        let transactionInput: Omit<TransactionInput, 'id'>;

        if (userProfile.role === 'dealer') {
            const associatedUserId = farmerId || values.associatedUserId;
            if (!associatedUserId) throw new Error("Farmer must be selected.");
            const associatedFarmer = farmers.find(f => f.id === associatedUserId) || selectedFarmer;
            if (!associatedFarmer) throw new Error("Farmer not found");

            transactionInput = {
                ...values,
                description: 'Payment received from farmer',
                amount: -Math.abs(values.amount), // Payment from farmer is a CREDIT for the dealer, so it's a negative value to reduce outstanding balance.
                userId: associatedFarmer.id,
                userName: associatedFarmer.name,
                dealerId: user.uid,
            };
        } else { // Farmer
             if (!userProfile.dealerCode) {
              throw new Error("Your account is not linked to a dealer. Please contact support.");
            }
            const dealerProfile = await getUserProfile(userProfile.dealerCode);
            if (!dealerProfile) {
                throw new Error("Could not find your associated dealer. Please check your dealer code.");
            }
            transactionInput = {
                ...values,
                description: 'Payment to dealer',
                amount: Math.abs(values.amount), // This is a debit from the dealer's perspective
                userId: user.uid,
                userName: userProfile.name,
                dealerId: dealerProfile.uid,
            };
        }

      await createTransaction(transactionInput);

      toast({
        title: 'Transaction Added',
        description: `The transaction has been successfully logged.`,
      });
      onTransactionAdded({ id: 'temp-id', ...transactionInput, date: transactionInput.date.toISOString() });
      setOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add transaction. Please try again.',
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
        description: 'Payment received',
        status: 'Paid',
        amount: 0,
        associatedUserId: farmerId,
        inventoryItemId: '',
        quantitySold: 0,
        paymentMethod: 'Cash',
        referenceNumber: '',
        remarks: '',
      });
    }
  };
  
  const modalTitle = userProfile?.role === 'dealer' ? `Log Payment from ${selectedFarmer?.name || 'Farmer'}` : 'Log a Payment to Dealer';
  const modalDescription = userProfile?.role === 'dealer' ? `Record a payment received from ${selectedFarmer?.name || 'a farmer'}.` : 'Record a payment you made to your dealer.';


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-primary" />
            {modalTitle}
          </DialogTitle>
          <DialogDescription>
            {modalDescription}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
            
            {userProfile?.role === 'dealer' && (
                 <FormField
                    control={form.control}
                    name="associatedUserId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>For Farmer</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={dataLoading || !!farmerId}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={dataLoading ? "Loading..." : "Select a farmer"} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {farmers.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
             
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Payment Amount</FormLabel>
                        <FormControl>
                            <Input 
                                type="number" 
                                placeholder="e.g., 15000" 
                                {...field} 
                                onChange={e => field.onChange(parseFloat(e.target.value))} 
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payment Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
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
                                <SelectItem value="Credit">Credit</SelectItem>
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
                        <Textarea placeholder="Add a note for this cash transaction..." {...field} value={field.value ?? ''}/>
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
                  <FormLabel>Transaction Date</FormLabel>
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
            
            <DialogFooter className="pt-4 sticky bottom-0 bg-background pb-0 -mb-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader className="animate-spin mr-2" /> Saving...</> : `Save Payment`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    
