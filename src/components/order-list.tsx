
'use client';

import { useState, useEffect } from 'react';
import { getOrdersForDealer, getOrdersForFarmer, Order, updateOrderStatus } from '@/services/orders.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CancelOrderAlert } from './cancel-order-alert';
import { DealerInventory } from './dealer-inventory';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User } from 'firebase/auth';
import { UserProfile } from '@/services/users.service';

interface OrderListProps {
  user: User;
  userProfile: UserProfile;
}

export function OrderList({ user, userProfile }: OrderListProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchOrders() {
            if (user && userProfile) {
                setLoading(true);
                const isDealer = userProfile.role === 'dealer';
                const fetchedOrders = isDealer
                    ? await getOrdersForDealer(user.uid)
                    : await getOrdersForFarmer(user.uid);
                setOrders(fetchedOrders);
                setLoading(false);
            }
        }
        fetchOrders();
    }, [user, userProfile]);

    const handleStatusUpdate = async (order: Order, status: 'Accepted' | 'Rejected' | 'Shipped' | 'Completed') => {
        try {
            await updateOrderStatus(order, status);
            setOrders(prev => prev.map(o => o.id === order.id ? {...o, status: status} : o));
            toast({
                title: `Order ${status}`,
                description: `Order #${order.id.substring(0,6)} has been ${status.toLowerCase()}.`
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'Could not update order status.'
            });
        }
    };
    
    const onOrderCancelled = (orderId: string) => {
        setOrders(prev => prev.filter(o => o.id !== orderId));
         toast({
            title: `Order Cancelled`,
            description: `Your order has been successfully cancelled.`
        });
    }

    const getStatusBadge = (status: Order['status']) => {
        switch (status) {
            case 'Pending':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
            case 'Accepted':
                return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Accepted</Badge>;
            case 'Rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            case 'Shipped':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Shipped</Badge>;
            case 'Completed':
                return <Badge>Completed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
        );
    }
    
    if (orders.length === 0) {
        if (userProfile?.role === 'farmer') {
            return <DealerInventory />;
        }
        return (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[400px]">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">No orders found</h3>
                    <p className="text-sm text-muted-foreground">
                        {userProfile?.role === 'farmer' ? "You haven't placed any orders yet." : "You haven't received any orders yet."}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Order History</CardTitle>
                <CardDescription>A list of your recent orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                {orders.map(order => (
                    <AccordionItem value={order.id} key={order.id}>
                        <AccordionTrigger>
                            <div className="flex justify-between items-center w-full pr-4">
                               <div className="flex items-center gap-4 text-left">
                                 {userProfile?.role === 'dealer' && (
                                     <Avatar>
                                        <AvatarImage src={`https://picsum.photos/seed/${order.farmerId}/100`} />
                                        <AvatarFallback>{order.farmerName?.charAt(0) || 'F'}</AvatarFallback>
                                    </Avatar>
                                 )}
                                <div className="flex flex-col">
                                    <span className="font-medium">
                                        {userProfile?.role === 'dealer' ? order.farmerName : `Order #${order.id.substring(0, 6)}`}
                                    </span>
                                    <span className="text-sm text-muted-foreground">{format(new Date(order.createdAt.seconds * 1000), 'PPP')}</span>
                                </div>
                               </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-semibold text-lg">₹{order.totalAmount.toLocaleString()}</span>
                                    {getStatusBadge(order.status)}
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="p-4 bg-muted/50 rounded-md">
                             <h4 className="font-semibold mb-2">Order Items:</h4>
                             <ul className="space-y-2 text-sm">
                                {order.items.map(item => (
                                    <li key={item.itemId} className="flex justify-between border-b border-muted pb-1 last:border-b-0">
                                        <div>
                                            <p>{item.quantity} {item.unit} of {item.name}</p>
                                            {item.purchaseSource && (
                                                <p className="text-xs text-muted-foreground">Supplier: {item.purchaseSource}</p>
                                            )}
                                        </div>
                                        <span>@ ₹{item.price.toLocaleString()}</span>
                                    </li>
                                ))}
                             </ul>
                             <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                                {userProfile?.role === 'dealer' && order.status === 'Pending' && (
                                    <>
                                    <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(order, 'Rejected')}>
                                        <X className="mr-2 h-4 w-4" />
                                        Reject
                                    </Button>
                                    <Button size="sm" onClick={() => handleStatusUpdate(order, 'Accepted')}>
                                        <Check className="mr-2 h-4 w-4" />
                                        Accept
                                    </Button>
                                    </>
                                )}
                                {userProfile?.role === 'dealer' && order.status === 'Accepted' && (
                                    <Button size="sm" onClick={() => handleStatusUpdate(order, 'Shipped')}>Mark as Shipped</Button>
                                )}
                                {userProfile?.role === 'dealer' && order.status === 'Shipped' && (
                                    <Button size="sm" onClick={() => handleStatusUpdate(order, 'Completed')}>Mark as Completed</Button>
                                )}
                                {userProfile?.role === 'farmer' && order.status === 'Pending' && (
                                    <CancelOrderAlert order={order} onOrderCancelled={() => onOrderCancelled(order.id)}>
                                        <Button size="sm" variant="destructive">
                                            Cancel Order
                                        </Button>
                                    </CancelOrderAlert>
                                )}
                             </div>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}
