
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader, ShoppingCart, PlusCircle, Trash2, IndianRupee, Calendar as CalendarIcon } from 'lucide-react';
import { createOrder, Order, OrderItem } from '@/services/orders.service';
import { getInventoryItems, InventoryItem } from '@/services/inventory.service';
import { useAuth } from '@/hooks/use-auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Image from 'next/image';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';

const OrderItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  quantity: z.number().min(1, 'Min 1'),
  unit: z.string(),
  price: z.number(),
});

const RequestOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'Please add at least one item to your order.'),
  createPayment: z.boolean().default(false),
  paymentAmount: z.union([z.number(), z.string()]).optional(),
  paymentDate: z.date().optional(),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'UPI', 'RTGS', 'NEFT']).optional(),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
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

type RequestOrderValues = z.infer<typeof RequestOrderSchema>;

interface RequestOrderModalProps {
  children: React.ReactNode;
  onOrderCreated: (order: Order) => void;
}

export function RequestOrderModal({ children, onOrderCreated }: RequestOrderModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const form = useForm<RequestOrderValues>({
    resolver: zodResolver(RequestOrderSchema),
    defaultValues: {
      items: [],
      createPayment: false,
      paymentAmount: '',
      paymentDate: new Date(),
      paymentMethod: undefined,
      referenceNumber: '',
      remarks: '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchItems = useWatch({ control: form.control, name: 'items' });
  const createPayment = form.watch("createPayment");
  const totalAmount = watchItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (open && userProfile?.dealerCode) {
      setInventoryLoading(true);
      const unsubscribe = getInventoryItems(userProfile.dealerCode, (items) => {
        setInventory(items.filter(item => (item.salesPrice ?? 0) > 0 && item.quantity > 0));
        setInventoryLoading(false);
      });
      return () => unsubscribe();
    }
  }, [open, userProfile]);

  const handleAddItem = (item: InventoryItem) => {
    const existingItemIndex = fields.findIndex(field => field.itemId === item.id);
    if (existingItemIndex > -1) {
      const existingItem = fields[existingItemIndex];
      update(existingItemIndex, { ...existingItem, quantity: existingItem.quantity + 1 });
    } else {
      append({
        itemId: item.id,
        name: item.name,
        quantity: 1,
        unit: item.unit,
        price: item.salesPrice || 0,
      });
    }
  };
  
  const handleSubmit = async (values: RequestOrderValues) => {
    if (!user || !userProfile?.dealerCode) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not find your dealer information.' });
      return;
    }
    
    setLoading(true);
    try {
      const paymentDetails = values.createPayment && values.paymentAmount && values.paymentMethod ? {
          amount: parseFloat(String(values.paymentAmount)),
          date: values.paymentDate!,
          method: values.paymentMethod!,
          referenceNumber: values.referenceNumber,
          remarks: values.remarks,
      } : undefined;

      const orderId = await createOrder({
        farmerId: user.uid,
        dealerId: userProfile.dealerCode,
        items: values.items,
        totalAmount,
      }, paymentDetails);

      toast({ title: 'Order Submitted', description: 'Your order has been sent to the dealer for review.' });
      onOrderCreated({ id: orderId, status: 'Pending', createdAt: {seconds: Date.now()/1000, nanoseconds: 0}, ...values, farmerId: user.uid, dealerId: userProfile.dealerCode, totalAmount });
      handleOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'Could not submit your order.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset({ 
        items: [],
        createPayment: false,
        paymentAmount: '',
        paymentDate: new Date(),
        paymentMethod: undefined,
        referenceNumber: '',
        remarks: '',
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Request New Order
          </DialogTitle>
          <DialogDescription>Browse your dealer's inventory and add items to request.</DialogDescription>
        </DialogHeader>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} id="order-form" className="grid md:grid-cols-2 gap-6 flex-1 overflow-hidden">
                <div className="flex flex-col gap-4 overflow-hidden">
                  <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader><CardTitle className="font-headline text-lg">Available Inventory</CardTitle></CardHeader>
                    <div className="flex-1 overflow-y-auto px-6">
                        {inventoryLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_,i) => <Skeleton key={i} className="h-16 w-full" />)}
                            </div>
                        ) : inventory.length > 0 ? (
                            <div className="space-y-2">
                                {inventory.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 p-2 rounded-md border">
                                        <Image src={`https://picsum.photos/seed/${item.id}/200`} data-ai-hint={`${item.category} product`} alt={item.name} width={48} height={48} className="rounded-md" />
                                        <div className="flex-1">
                                            <p className="font-medium">{item.name}</p>
                                            {item.purchaseSource && <p className="text-xs text-muted-foreground">From: {item.purchaseSource}</p>}
                                            <p className="text-sm text-muted-foreground">₹{item.salesPrice?.toLocaleString()} / {item.unit}</p>
                                        </div>
                                        <Button type="button" size="icon" onClick={() => handleAddItem(item)}>
                                            <PlusCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ): (
                            <p className="text-center text-muted-foreground pt-10">Your dealer has no inventory available for sale.</p>
                        )}
                    </div>
                  </Card>
                </div>
                <div className="flex flex-col gap-4 overflow-hidden">
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
                        <Card className="flex flex-col">
                            <CardHeader><CardTitle className="font-headline text-lg">Your Order</CardTitle></CardHeader>
                            <CardContent className="flex-1">
                            {fields.length === 0 ? (
                                <p className="text-center text-muted-foreground py-10">Your cart is empty. Add items from the inventory.</p>
                            ) : (
                                <div className="space-y-2">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2 p-2 rounded-md border">
                                            <div className="flex-1">
                                                    <p className="font-medium">{field.name}</p>
                                                    <p className="text-sm text-muted-foreground">₹{((watchItems[index]?.price || 0) * (watchItems[index]?.quantity || 0)).toLocaleString()}</p>
                                            </div>
                                            <Input 
                                                type="number"
                                                {...form.register(`items.${index}.quantity`, { valueAsNumber: true, min: 1 })}
                                                className="w-16 text-center"
                                            />
                                            <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => remove(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            </CardContent>
                            {fields.length > 0 && (
                                <CardContent>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Total:</span>
                                        <span className="flex items-center gap-1"><IndianRupee className="w-5 h-5" />{totalAmount.toLocaleString()}</span>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                        
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                <FormField control={form.control} name="createPayment"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            <div className="space-y-1 leading-none"><FormLabel>Make a payment with this order?</FormLabel></div>
                                        </FormItem>
                                    )}
                                />
                                {createPayment && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <FormField control={form.control} name="paymentAmount" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Amount to Pay</FormLabel>
                                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                            <FormItem><FormLabel>Payment Method</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Cash">Cash</SelectItem><SelectItem value="UPI">UPI</SelectItem><SelectItem value="RTGS">RTGS</SelectItem><SelectItem value="NEFT">NEFT</SelectItem><SelectItem value="Bank Transfer">Bank Transfer (Other)</SelectItem>
                                                </SelectContent>
                                            </Select><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="referenceNumber" render={({ field }) => (
                                            <FormItem><FormLabel>Reference No. (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="remarks" render={({ field }) => (
                                            <FormItem><FormLabel>Remarks (Optional)</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="paymentDate" render={({ field }) => (
                                            <FormItem className="flex flex-col"><FormLabel>Payment Date</FormLabel>
                                            <Popover><PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                            </PopoverContent></Popover><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </Form>
        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="order-form" disabled={loading || fields.length === 0}>
            {loading ? <><Loader className="animate-spin mr-2" /> Submitting...</> : 'Submit Order Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
