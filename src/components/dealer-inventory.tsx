
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getInventoryItems, InventoryItem, InventoryCategories } from '@/services/inventory.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';
import Image from 'next/image';
import { Button } from './ui/button';
import { PlusCircle, Warehouse, Filter, X } from 'lucide-react';
import { CreateOrderModal } from './create-order-modal';
import { Order } from '@/services/orders.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { useUser, useFirebase } from '@/firebase';


export function DealerInventory() {
    const { userProfile } = useUser();
    const { db } = useFirebase();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [inventoryLoading, setInventoryLoading] = useState(true);
    const [suppliers, setSuppliers] = useState<string[]>([]);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (userProfile?.dealerCode && db) {
            setInventoryLoading(true);
            const unsubscribe = getInventoryItems(db, userProfile.dealerCode, (items) => {
                setInventory(items.filter(item => (item.salesPrice ?? 0) > 0 && item.quantity > 0));
                setInventoryLoading(false);
            });
            
            // This is incorrect, a farmer should not see suppliers, only the dealer's inventory
            // getUniquePurchaseSources(userProfile.dealerCode).then(setSuppliers);

            return () => unsubscribe();
        } else {
            setInventoryLoading(false);
        }
    }, [userProfile, db]);
    
    const handleOrderCreated = (order: Order) => {
        // The order list will update automatically on the page
    }

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const categoryMatch = !selectedCategory || selectedCategory === 'ALL_CATEGORIES' || item.category === selectedCategory;
            const searchMatch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
            return categoryMatch && searchMatch;
        });
    }, [inventory, selectedCategory, searchQuery]);
    
    const clearFilters = () => {
        setSelectedCategory('');
        setSearchQuery('');
    }

    if (!userProfile?.dealerCode) {
         return (
             <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[400px]">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">Not Connected to a Dealer</h3>
                    <p className="text-sm text-muted-foreground">
                       You need to be connected to a dealer to view their inventory and place orders.
                    </p>
                </div>
            </div>
         )
    }

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className='flex justify-between items-start'>
                    <div>
                        <CardTitle className="font-headline flex items-center gap-2">
                           <Warehouse className="w-6 h-6 text-primary" />
                           Dealer's Inventory
                        </CardTitle>
                        <CardDescription>Items available for order from your dealer.</CardDescription>
                    </div>
                     <CreateOrderModal onOrderCreated={handleOrderCreated}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Place New Order
                        </Button>
                    </CreateOrderModal>
                </div>
                 <div className="flex flex-wrap items-center gap-2 pt-4">
                    <Filter className="w-5 h-5 text-muted-foreground" />
                     <Input 
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-auto flex-grow"
                    />
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL_CATEGORIES">All Categories</SelectItem>
                            {InventoryCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={clearFilters}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-[45vh] pr-4">
                    {inventoryLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_,i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : filteredInventory.length > 0 ? (
                        <div className="space-y-2">
                            {filteredInventory.map(item => (
                                <div key={item.id} className="flex items-center gap-4 p-2 rounded-md border">
                                    <Image src={`https://picsum.photos/seed/${item.id}/200`} data-ai-hint={`${item.category} product`} alt={item.name} width={48} height={48} className="rounded-md" />
                                    <div className="flex-1">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">₹{item.salesPrice?.toLocaleString()} / {item.unit}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Stock: {item.quantity}</p>
                                </div>
                            ))}
                        </div>
                    ): (
                         <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[200px]">
                            <div className="flex flex-col items-center gap-1 text-center">
                                <h3 className="text-2xl font-bold tracking-tight">No Items Found</h3>
                                <p className="text-sm text-muted-foreground">
                                    No inventory matches your current filters, or the dealer has no items for sale.
                                </p>
                                 <Button variant="link" onClick={clearFilters}>Clear Filters</Button>
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
