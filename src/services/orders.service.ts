// src/services/orders.service.ts
import { getFirestore, Firestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
  serverTimestamp,
  doc,
  writeBatch,
  Timestamp,
  orderBy,
  runTransaction,
  increment,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { z } from 'zod';
import { TransactionInput, TransactionSchema } from './transactions.service';
import { createNotification } from './notifications.service';
import { createFarmer, getFarmer } from './farmers.service';

const db = getFirestore(app);

const OrderItemSchema = z.object({
    itemId: z.string(),
    name: z.string(),
    quantity: z.number().min(1),
    unit: z.string(),
    price: z.number().min(0),
    purchaseSource: z.string().optional(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
    farmerId: z.string(),
    farmerName: z.string().optional(), // Denormalized for easy display
    dealerId: z.string(),
    items: z.array(OrderItemSchema),
    totalAmount: z.number().min(0),
    status: z.enum(['Pending', 'Accepted', 'Rejected', 'Shipped', 'Completed']),
    createdAt: z.any(),
});

export type Order = z.infer<typeof OrderSchema> & { id: string };
export type OrderInput = z.infer<typeof OrderSchema>;

type CreateOrderData = Omit<OrderInput, 'createdAt' | 'status' | 'farmerId' | 'farmerName'> & {
    farmerId?: string;
    newFarmer?: { name: string; location: string };
};


export const createOrder = async (
    orderData: CreateOrderData,
    paymentDetails?: {
        amount: number;
        date: Date;
        method: 'Cash' | 'Bank Transfer' | 'UPI' | 'RTGS' | 'NEFT';
        referenceNumber?: string;
        remarks?: string;
    }
): Promise<string> => {
    const orderRef = doc(collection(db, 'orders'));
    const orderId = orderRef.id;

    await runTransaction(db, async (t) => {
        let finalFarmerId = orderData.farmerId;
        let farmerName = '';

        // If creating a new farmer, do that first within the transaction
        if (orderData.newFarmer?.name && orderData.newFarmer.location) {
            const newFarmerId = await createFarmer({
                name: orderData.newFarmer.name,
                location: orderData.newFarmer.location,
                dealerId: orderData.dealerId,
                batchSize: 100, // Default value
            }, true); // Create as placeholder
            finalFarmerId = newFarmerId;
            farmerName = orderData.newFarmer.name;
        }

        if (!finalFarmerId) {
            throw new Error("A farmer must be selected or created for the order.");
        }
        
        if (!farmerName) {
            const farmerProfile = await getFarmer(finalFarmerId);
            if (!farmerProfile) throw new Error("Farmer profile not found.");
            farmerName = farmerProfile.name;
        }


        // 1. Create the order
        t.set(orderRef, {
            ...orderData,
            farmerId: finalFarmerId,
            farmerName: farmerName,
            status: 'Pending',
            createdAt: serverTimestamp(),
        });

        // 2. If payment is included, create the payment transaction
        if (paymentDetails && paymentDetails.amount > 0) {
            const farmerDoc = await getDoc(doc(db, 'users', finalFarmerId));
            const farmerProfile = farmerDoc.data();

            const transactionInput: Omit<TransactionInput, 'createdAt'> = {
                date: paymentDetails.date,
                description: `Payment for Order #${orderId.substring(0, 6)}`,
                amount: -Math.abs(paymentDetails.amount), // Payment from farmer reduces their outstanding balance
                status: 'Paid',
                userId: finalFarmerId,
                userName: farmerName,
                dealerId: orderData.dealerId,
                paymentMethod: paymentDetails.method,
                referenceNumber: paymentDetails.referenceNumber || null,
                remarks: paymentDetails.remarks || null,
                purchaseOrderId: orderId, // Link payment to order
            };
            
            const transactionRef = doc(collection(db, 'transactions'));
            t.set(transactionRef, {
                 ...TransactionSchema.omit({createdAt: true}).parse(transactionInput),
                 date: Timestamp.fromDate(transactionInput.date),
                 createdAt: serverTimestamp(),
            });
            
            // Also update farmer's outstanding balance
            const farmerLedgerRef = doc(db, 'farmers', finalFarmerId);
            t.update(farmerLedgerRef, { outstanding: increment(-Math.abs(paymentDetails.amount)) });

        }
    });


    // Notify the farmer about the new order
    await createNotification({
        userId: orderData.farmerId!,
        title: "Order Submitted",
        message: `Your order of ₹${orderData.totalAmount.toLocaleString()} has been sent to your dealer.`,
        type: 'new_order',
        link: `/orders`
    });

    return orderId;
};

export const getOrdersForFarmer = (farmerId: string, callback: (orders: Order[]) => void): Unsubscribe => {
    const q = query(collection(db, 'orders'), where("farmerId", "==", farmerId), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const orders: Order[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        callback(orders);
    });
};

export const getOrdersForDealer = (dealerId: string, callback: (orders: Order[]) => void): Unsubscribe => {
    const q = query(collection(db, 'orders'), where("dealerId", "==", dealerId), orderBy("createdAt", "desc"));
    
    return onSnapshot(q, async (snapshot) => {
        const orders: Order[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        callback(orders);
    });
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
        return null;
    }
    return { id: orderSnap.id, ...orderSnap.data() } as Order;
};


export const updateOrderStatus = async (
    order: Order,
    newStatus: 'Accepted' | 'Rejected' | 'Shipped' | 'Completed'
): Promise<void> => {
    const orderRef = doc(db, 'orders', order.id);

    await runTransaction(db, async (t) => {
        if (newStatus !== 'Accepted') {
            // For non-Accepted statuses, just update the order.
            t.update(orderRef, { status: newStatus });
            return;
        }

        // --- READS FIRST ---
        // Fetch farmer's name for the transaction record.
        const farmerProfileDoc = await getDoc(doc(db, 'farmers', order.farmerId));
        if (!farmerProfileDoc.exists()) throw new Error("Farmer not found");
        const farmerName = farmerProfileDoc.data().name;
        
        let totalCostOfGoodsSold = 0;
        const inventoryDocs = await Promise.all(
            order.items.map(item => t.get(doc(db, 'inventory', item.itemId)))
        );

        for (let i = 0; i < order.items.length; i++) {
            const item = order.items[i];
            const inventoryDoc = inventoryDocs[i];
            if (inventoryDoc.exists()) {
                const inventoryData = inventoryDoc.data();
                if(inventoryData.quantity < item.quantity) {
                    throw new Error(`Not enough stock for ${item.name}. Only ${inventoryData.quantity} available.`);
                }
                totalCostOfGoodsSold += (inventoryData.purchasePrice || 0) * item.quantity;
            } else {
                 throw new Error(`Inventory item ${item.name} not found.`);
            }
        }
        // --- END OF READS ---


        // --- WRITES SECOND ---
        // 1. Update the order status.
        t.update(orderRef, { status: newStatus });

        // 2. Create the financial transaction.
        const itemsDescription = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
        const transactionData: TransactionInput = {
            date: new Date(),
            description: `Sale from Order #${order.id.substring(0, 6)}`,
            amount: order.totalAmount, // This is a debit for the farmer, so a positive value
            status: 'Paid', // The transaction is "Paid" on "Credit"
            userId: order.farmerId,
            userName: farmerName, 
            dealerId: order.dealerId,
            paymentMethod: 'Credit',
            purchaseOrderId: order.id, // Link transaction to the order
            inventoryItemName: itemsDescription, // Add concatenated item names
            costOfGoodsSold: totalCostOfGoodsSold,
        };
        const newTransactionRef = doc(collection(db, "transactions"));
        t.set(newTransactionRef, {
            ...TransactionSchema.omit({createdAt: true}).parse(transactionData),
            date: Timestamp.fromDate(transactionData.date),
            createdAt: serverTimestamp()
        });

        // 3. Update farmer's outstanding balance.
        const farmerRef = doc(db, 'farmers', order.farmerId);
        t.update(farmerRef, { outstanding: increment(order.totalAmount) });

        // 4. Update inventory for each item in the order.
        for (let i = 0; i < order.items.length; i++) {
            const item = order.items[i];
            const inventoryRef = doc(db, 'inventory', item.itemId);
            t.update(inventoryRef, { quantity: increment(-item.quantity) });
        }
        // --- END OF WRITES ---
    });

    // Send notification to farmer about the status update
    await createNotification({
        userId: order.farmerId,
        title: `Order ${newStatus}`,
        message: `Your order #${order.id.substring(0,6)} has been ${newStatus.toLowerCase()}.`,
        type: 'order_status',
        link: '/orders'
    });
};

export const deleteOrder = async (orderId: string): Promise<void> => {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
        throw new Error("Order not found.");
    }
    const order = orderSnap.data() as Order;
    if (order.status !== 'Pending') {
        throw new Error("Only pending orders can be cancelled.");
    }

    await deleteDoc(orderRef);
};
