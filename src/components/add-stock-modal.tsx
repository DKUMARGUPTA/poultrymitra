// src/components/add-stock-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Calendar as CalendarIcon, Trash2, IndianRupee, ChevronsUpDown } from 'lucide-react';
import { createPurchaseOrder, InventoryCategory, InventoryItemInput, InventoryCategories } from '@/services/inventory.service';
import { useUser } from '@/firebase';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const OrderItemSchema = z.object({
    name: z.string().min(1, "Item name is required."),
    category: z.enum(['Feed', 'Vaccine', 'Medicine', 'Chicks', 'Other']),
    quantity: z.number().min(0.01, "Quantity must be positive."),
    unit: z.string().min(1, "Unit is required."),
    purchasePrice: z.number().min(0, "Price cannot be negative.").optional(),
    salesPrice: z.number().min(0, "Price cannot be negative.").optional(),
    hasGst: z.boolean().optional().default(false),
    gstRate: z.number().min(0, "GST must be non-negative.").optional(),
});

const AdditionalCostSchema = z.object({
    description: z.string().min(1, "Description is required."),
    amount: z.number().min(0.01, "Amount must be positive."),
    paidTo: z.string().min(1, "Recipient is required."),
});

const AddStockFormSchema = z.object({
    orderDate: z.date(),
    purchaseSource: z.string().optional(),
    items: z.array(OrderItemSchema).min(1, "You must add at least one item."),
    additionalCosts: z.array(AdditionalCostSchema).optional(),
    createPayment: z.boolean().default(false),
    paymentAmount: z.union([z.number(), z.string()]).optional(),
    paymentDate: z.date().optional(),
    paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Credit', 'UPI', 'RTGS', 'NEFT']).optional(),
    paymentReference: z.string().optional(),
    paymentRemarks: z.string().optional(),
}).refine(data => {
    if (data.createPayment) {
        const amount = parseFloat(String(data.paymentAmount));
        return !!data.paymentMethod && !isNaN(amount) && amount > 0;
    }
    return true;
}, {
    message: "Payment method and a valid amount are required when creating a payment.",
    path: ["paymentAmount"],
});
type AddStockFormValues = z.infer<typeof AddStockFormSchema>;

interface AddStockModalProps {
  children: React.ReactNode;
  onStockAdded: (purchaseOrderId: string) => void;
}

const categoryToUnitMap: Record<InventoryCategory, string> = {
    'Feed': 'Bags',
    'Vaccine': 'Doses',
    'Medicine': 'Bottles',
    'Chicks': 'Chicks',
    'Other': 'Units',
}

const expenseTypes = ["Transportation Cost", "Labor Cost", "Road Expense", "Other"];

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <FormLabel>
        {children} <span className="text-destructive">*</span>
    </FormLabel>
);


export function AddStockModal({ children, onStockAdded }: AddStockModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<AddStockFormValues>({
    resolver: zodResolver(AddStockFormSchema),
    defaultValues: {
      orderDate: new Date(),
      purchaseSource: '',
      items: [{ name: '', category: 'Feed', quantity: 1, unit: 'Bags', purchasePrice: 0, salesPrice: 0, hasGst: false, gstRate: 0 }],
      additionalCosts: [],
      createPayment: false,
      paymentDate: new Date(),
      paymentAmount: '',
      paymentMethod: undefined,
      paymentReference: '',
      paymentRemarks: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });
  
  const { fields: costFields, append: appendCost, remove: removeCost } = useFieldArray({
      control: form.control,
      name: "additionalCosts"
  });

  const watchItems = useWatch({ control: form.control, name: 'items' });
  const watchOrderDate = useWatch({ control: form.control, name: 'orderDate' });
  
  const itemsTotal = watchItems.reduce((sum, item) => {
      const itemCost = (item.purchasePrice || 0) * (item.quantity || 0);
      const gstAmount = item.hasGst ? itemCost * ((item.gstRate || 0) / 100) : 0;
      return sum + itemCost + gstAmount;
    }, 0);

  const createPayment = form.watch("createPayment");
  const paymentMethod = form.watch("paymentMethod");
  
  useEffect(() => {
    if (createPayment) {
        form.setValue('paymentAmount', itemsTotal);
    }
  }, [itemsTotal, createPayment, form]);
  
   useEffect(() => {
    if (watchOrderDate) {
        form.setValue('paymentDate', watchOrderDate);
    }
  }, [watchOrderDate, form]);

  const watchedItemFields = useWatch({ control: form.control, name: 'items' });

  useEffect(() => {
    watchedItemFields.forEach((item, index) => {
      if (!item.hasGst) {
        if (form.getValues(`items.${index}.gstRate`) !== 0) {
            form.setValue(`items.${index}.gstRate`, 0);
        }
      }
    });
  }, [watchedItemFields, form]);


  const handleSubmit = async (values: AddStockFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to add stock.' });
      return;
    }
    
    const paymentAmountAsNumber = parseFloat(String(values.paymentAmount));

    setLoading(true);

    try {
        const paymentDetails = values.createPayment ? {
            amount: paymentAmountAsNumber,
            date: values.paymentDate!,
            method: values.paymentMethod!,
            reference: values.paymentReference,
            remarks: values.paymentRemarks,
        } : undefined;

      const { purchaseOrderId } = await createPurchaseOrder(
          values.items, 
          values.orderDate,
          paymentDetails, 
          values.additionalCosts,
          values.purchaseSource, 
          user.uid
        );
      
      toast({
        title: 'Purchase Order Created',
        description: `Order #${purchaseOrderId.substring(0,5)} has been added to your inventory.`,
      });
      onStockAdded(purchaseOrderId);
      handleOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create purchase order.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset({
        orderDate: new Date(),
        purchaseSource: '',
        items: [{ name: '', category: 'Feed', quantity: 1, unit: 'Bags', purchasePrice: 0, salesPrice: 0, hasGst: false, gstRate: 0 }],
        additionalCosts: [],
        createPayment: false,
        paymentDate: new Date(),
        paymentAmount: '',
        paymentMethod: undefined,
        paymentReference: '',
        paymentRemarks: '',
      });
    }
  };
  
  const handleCategoryChange = (value: InventoryCategory, index: number) => {
      form.setValue(`items.${index}.category`, value);
      form.setValue(`items.${index}.unit`, categoryToUnitMap[value] || 'Units');
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-primary" />
            New Purchase Order
          </DialogTitle>
          <DialogDescription>
            Add one or more items you've purchased from a supplier. Fields marked with <span className="text-destructive">*</span> are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
             <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="orderDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <RequiredLabel>Date of Order</RequiredLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                        </PopoverContent></Popover><FormMessage /></FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="purchaseSource"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Purchase Source / Supplier</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., SKM Feeds" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
            <Separator />
            
            {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md relative space-y-4">
                    {fields.length > 1 && (
                         <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
                    <FormField
                    control={form.control}
                    name={`items.${index}.name`}
                    render={({ field }) => (
                        <FormItem>
                        <RequiredLabel>Item Name</RequiredLabel>
                        <FormControl><Input placeholder="e.g., Starter Pellets" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name={`items.${index}.category`}
                            render={({ field }) => (
                                <FormItem><RequiredLabel>Category</RequiredLabel>
                                <Select onValueChange={(value: InventoryCategory) => handleCategoryChange(value, index)} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {InventoryCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`items.${index}.unit`}
                            render={({ field }) => ( <FormItem><RequiredLabel>Unit</RequiredLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => ( <FormItem><RequiredLabel>Quantity</RequiredLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem>)}
                        />
                         <FormField
                            control={form.control}
                            name={`items.${index}.purchasePrice`}
                            render={({ field }) => ( <FormItem><FormLabel>Purchase Price (per unit)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)}
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4 items-end">
                        <FormField
                            control={form.control}
                            name={`items.${index}.salesPrice`}
                            render={({ field }) => ( <FormItem><FormLabel>Sales Price (per unit)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)}
                        />
                        <FormField
                            control={form.control}
                            name={`items.${index}.hasGst`}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel>Apply GST?</FormLabel>
                                </FormItem>
                            )}
                        />
                    </div>
                     {watchedItemFields[index]?.hasGst && (
                        <FormField
                            control={form.control}
                            name={`items.${index}.gstRate`}
                            render={({ field }) => ( <FormItem><FormLabel>GST Rate (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 18" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)}
                        />
                     )}
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', category: 'Feed', quantity: 1, unit: 'Bags', purchasePrice: 0, salesPrice: 0, hasGst: false, gstRate: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Another Item
            </Button>
            <Separator />
            
            <Card>
              <CardContent className="p-4 space-y-2">
                <Label>Additional Costs</Label>
                <p className="text-xs text-muted-foreground">Log expenses like transport or labor associated with this purchase order. These will be recorded as separate business expenses.</p>
                <div className="space-y-2 mt-2">
                  {costFields.map((field, index) => (
                    <div key={field.id} className="p-2 border rounded-md relative space-y-2">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeCost(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                            control={form.control}
                            name={`additionalCosts.${index}.description`}
                            render={({ field }) => (
                                <FormItem><FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                    <SelectContent>{expenseTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                             <FormField
                                control={form.control}
                                name={`additionalCosts.${index}.paidTo`}
                                render={({ field }) => ( <FormItem><RequiredLabel>Paid To</RequiredLabel><FormControl><Input placeholder="e.g., Transport Co." {...field} /></FormControl><FormMessage /></FormItem>)}
                            />
                            <FormField
                            control={form.control}
                            name={`additionalCosts.${index}.amount`}
                            render={({ field }) => ( <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="Amount" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem>)}
                            />
                        </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendCost({ description: 'Transportation Cost', paidTo: '', amount: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Cost
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Separator />
            
            <Card>
                <CardContent className="p-4 space-y-4">
                    <FormField control={form.control} name="createPayment"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="space-y-1 leading-none"><FormLabel>Create payment transaction for this purchase?</FormLabel><FormMessage /></div>
                            </FormItem>
                        )}
                    />

                    {createPayment && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex justify-between items-center p-2 bg-muted rounded-md">
                                <span className="text-sm font-medium">Total (including GST):</span>
                                <span className="text-lg font-bold flex items-center gap-1"><IndianRupee className="w-4 h-4" />{itemsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <FormField control={form.control} name="paymentAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between items-center">
                                            <RequiredLabel>Amount Paid To Supplier</RequiredLabel>
                                            <Button type="button" size="sm" variant="link" className="h-auto p-0" onClick={() => form.setValue('paymentAmount', itemsTotal)}>Pay in Full</Button>
                                        </div>
                                    <FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}/></FormControl>
                                    <FormMessage /></FormItem>
                                )} />
                            <FormField control={form.control} name="paymentMethod"
                                render={({ field }) => (
                                    <FormItem><RequiredLabel>Payment Method</RequiredLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem><SelectItem value="UPI">UPI</SelectItem><SelectItem value="RTGS">RTGS</SelectItem><SelectItem value="NEFT">NEFT</SelectItem><SelectItem value="Bank Transfer">Bank Transfer (Other)</SelectItem><SelectItem value="Credit">On Credit (No payment)</SelectItem>
                                        </SelectContent>
                                    </Select><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="paymentReference"
                                    render={({ field }) => (
                                        <FormItem><FormLabel>UTR / Reference Number (Optional)</FormLabel>
                                        <FormControl><Input placeholder="Enter transaction ID" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                {paymentMethod === 'Cash' && (
                                    <FormField control={form.control} name="paymentRemarks"
                                        render={({ field }) => (
                                        <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea placeholder="Add a note for this cash transaction..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    )}
                                <FormField control={form.control} name="paymentDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col"><RequiredLabel>Payment Date</RequiredLabel>
                                        <Popover><PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                                        </PopoverContent></Popover><FormMessage /></FormItem>
                                    )} />
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader className="animate-spin mr-2" /> Creating Order...</> : 'Create Order'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
