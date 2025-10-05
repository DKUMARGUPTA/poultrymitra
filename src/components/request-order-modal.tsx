
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader, ShoppingCart, PlusCircle, Trash2, IndianRupee, UserPlus, Calendar as CalendarIcon } from 'lucide-react';
import { createOrder, Order, OrderItem } from '@/services/orders.service';
import { getInventoryItems, InventoryItem } from '@/services/inventory.service';
import { useUser, useFirebase } from '@/firebase';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Image from 'next/image';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import type { Farmer } from '@/services/farmers.service';
import { getFarmersByDealer } from '@/services/farmers.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';


const OrderItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  quantity: z.number().min(1, 'Min 1'),
  unit: z.string(),
  price: z.number(),
  purchaseSource: z.string().optional(),
});

const NewFarmerSchema = z.object({
    name: z.string(),
    location: z.string(),
});

const CreateOrderSchema = z.object({
  farmerId: z.string().optional(),
  newFarmer: NewFarmerSchema.optional(),
  items: z.array(OrderItemSchema).min(1, 'Please add at least one item to your order.'),
  createPayment: z.boolean().default(false),
  paymentAmount: z.union([z.number(), z.string()]).optional(),
  paymentDate: z.date().optional(),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'UPI', 'RTGS', 'NEFT']).optional(),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
}).refine(data => data.farmerId || (data.newFarmer?.name && data.newFarmer.location), {
    message: 'Either select an existing farmer or create a new one.',
    path: ['farmerId'],
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


type CreateOrderValues = z.infer<typeof CreateOrderSchema>;

interface CreateOrderModalProps {
  children: React.ReactNode;
  onOrderCreated: (order: Order) => void;
  farmer?: Farmer;
}

export function CreateOrderModal({ children, onOrderCreated, farmer }: CreateOrderModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isCreatingNewFarmer, setIsCreatingNewFarmer] = useState(false);
  const { toast } = useToast();
  const { user } = useUser(); // This is the dealer
  const { db } = useFirebase();

  const form = useForm<CreateOrderValues>({
    resolver: zodResolver(CreateOrderSchema),
    defaultValues: {
      farmerId: farmer?.id || '',
      items: [],
      newFarmer: { name: '', location: '' },
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
  const watchFarmerId = useWatch({ control: form.control, name: 'farmerId' });
  const createPayment = form.watch("createPayment");
  const totalAmount = watchItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  useEffect(() => {
    if (isCreatingNewFarmer) {
        form.setValue('farmerId', undefined);
    }
  }, [isCreatingNewFarmer, form]);

  useEffect(() => {
    if (watchFarmerId) {
        setIsCreatingNewFarmer(false);
        form.setValue('newFarmer', { name: '', location: '' });
    }
  }, [watchFarmerId, form]);

  useEffect(() => {
    if (open && user && db) {
      setDataLoading(true);
      const unsubInventory = getInventoryItems(db, user.uid, (items) => {
        setInventory(items.filter(item => (item.salesPrice ?? 0) > 0 && item.quantity > 0));
      });
      if (!farmer) {
        const unsubFarmers = getFarmersByDealer(db, user.uid, (f) => {
          setFarmers(f);
        });
        setDataLoading(false);
        return () => {
          unsubInventory();
          unsubFarmers();
        };
      } else {
        setFarmers([farmer]);
        form.setValue('farmerId', farmer.id);
        setDataLoading(false);
        return () => unsubInventory();
      }
    }
  }, [open, user, farmer, form, db]);

  const handleAddItem = (item: InventoryItem) => {
    const existingItemIndex = fields.findIndex(field => field.itemId === item.id);
    if (existingItemIndex > -1) {
      const existingItem = fields[existingItemIndex];
      const newQuantity = (existingItem.quantity || 0) + 1;
      update(existingItemIndex, { ...existingItem, quantity: newQuantity });
    } else {
      append({
        itemId: item.id,
        name: item.name,
        quantity: 1,
        unit: item.unit,
        price: item.salesPrice || 0,
        purchaseSource: item.purchaseSource,
      });
    }
  };
  
  const handleSubmit = async (values: CreateOrderValues) => {
    if (!user || !db) {
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

      const orderId = await createOrder(db, {
        farmerId: values.farmerId,
        newFarmer: values.newFarmer,
        dealerId: user.uid,
        items: values.items,
        totalAmount,
      }, paymentDetails);
      
      const newOrder: Order = { 
        id: orderId, 
        status: 'Pending', 
        createdAt: {seconds: Date.now()/1000, nanoseconds: 0},
        farmerId: values.farmerId || 'new', // placeholder
        dealerId: user.uid,
        items: values.items,
        totalAmount 
      };

      toast({ title: 'Order Created', description: 'The order has been sent to the farmer for approval.' });
      onOrderCreated(newOrder);
      handleOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'Could not create the order.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset({
        farmerId: farmer?.id || '',
        items: [],
        newFarmer: { name: '', location: '' },
        createPayment: false,
        paymentAmount: '',
        paymentDate: new Date(),
        paymentMethod: undefined,
        referenceNumber: '',
        remarks: '',
      });
      setIsCreatingNewFarmer(false);
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
            Create Order for Farmer
          </DialogTitle>
          <DialogDescription>Click an item from the inventory to add it to the order cart.</DialogDescription>
        </DialogHeader>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} id="order-form" className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
                <div className="flex flex-col gap-4 overflow-hidden">
                  <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader><CardTitle className="font-headline text-lg">Available Inventory</CardTitle></CardHeader>
                    <div className="flex-1 overflow-y-auto px-6">
                        {dataLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_,i) => <Skeleton key={i} className="h-16 w-full" />)}
                            </div>
                        ) : inventory.length > 0 ? (
                            <div className="space-y-2">
                                {inventory.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 p-2 rounded-md border cursor-pointer hover:bg-muted/50" onClick={() => handleAddItem(item)}>
                                        <Image src={`https://picsum.photos/seed/${item.id}/200`} data-ai-hint={`${item.category} product`} alt={item.name} width={48} height={48} className="rounded-md" />
                                        <div className="flex-1">
                                            <p className="font-medium">{item.name}</p>
                                            {item.purchaseSource && <p className="text-xs text-muted-foreground">From: {item.purchaseSource}</p>}
                                            <p className="text-sm text-muted-foreground">₹{item.salesPrice?.toLocaleString()} / {item.unit}</p>
                                        </div>
                                        <PlusCircle className="h-5 w-5 text-primary" />
                                    </div>
                                ))}
                            </div>
                        ): (
                            <p className="text-center text-muted-foreground pt-10">You have no inventory available for sale.</p>
                        )}
                    </div>
                  </Card>
                </div>
                <div className="flex flex-col gap-4 overflow-hidden">
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
                        <Card className="flex-grow flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-headline text-lg">Your Order Cart</CardTitle>
                                
                                {!isCreatingNewFarmer && !farmer && (
                                    <FormField
                                        control={form.control}
                                        name="farmerId"
                                        render={({ field }) => (
                                            <FormItem className="pt-2">
                                                <Select onValueChange={field.onChange} value={field.value} disabled={dataLoading}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={dataLoading ? "Loading farmers..." : "Select a farmer"} />
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

                                {farmer && <p className="font-medium pt-2">For: {farmer.name}</p>}
                                
                                {!farmer && (
                                    <div className="text-center my-2">
                                    <Button type="button" variant="link" className="text-xs" onClick={() => setIsCreatingNewFarmer(!isCreatingNewFarmer)}>
                                        {isCreatingNewFarmer ? 'Or select an existing farmer' : 'Or create a new farmer'}
                                    </Button>
                                    </div>
                                )}
                                
                                {isCreatingNewFarmer && (
                                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                        <h4 className="font-semibold text-sm flex items-center gap-2"><UserPlus /> New Farmer Details</h4>
                                        <FormField
                                            control={form.control}
                                            name="newFarmer.name"
                                            render={({ field }) => (
                                                <FormItem><FormLabel className="sr-only">Name</FormLabel><FormControl><Input placeholder="Farmer Name" {...field} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="newFarmer.location"
                                            render={({ field }) => (
                                                <FormItem><FormLabel className="sr-only">Location</FormLabel><FormControl><Input placeholder="Location (e.g. Pune)" {...field} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="flex-1">
                                {fields.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-10">Your cart is empty. Add items from the inventory.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="flex flex-col gap-2 p-2 rounded-md border">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1">
                                                            <p className="font-medium">{field.name}</p>
                                                            <p className="text-sm text-muted-foreground">₹{((watchItems[index]?.price || 0) * (watchItems[index]?.quantity || 0)).toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                         <Input type="number" 
                                                            {...form.register(`items.${index}.quantity`, { valueAsNumber: true, min: 1 })}
                                                            className="w-16 h-8 text-center" 
                                                        />
                                                        <span className="text-sm text-muted-foreground">{field.unit}</span>
                                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(index)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 pl-1">
                                                    <Label htmlFor={`price-${index}`} className="text-xs">Price/unit:</Label>
                                                    <Input
                                                        id={`price-${index}`}
                                                        type="number"
                                                        {...form.register(`items.${index}.price`, { valueAsNumber: true })}
                                                        className="w-24 h-8"
                                                    />
                                                </div>
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
                        {fields.length > 0 && (
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
                                                <FormLabel>Amount Paid by Farmer</FormLabel>
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
                        )}
                    </div>
                </div>
            </form>
        </Form>
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="order-form" disabled={loading || fields.length === 0}>
            {loading ? <><Loader className="animate-spin mr-2" /> Creating...</> : 'Create Order Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
