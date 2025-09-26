// src/services/inventory.service.ts
import { getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, DocumentData, QuerySnapshot, Unsubscribe, serverTimestamp, getDocs, orderBy, runTransaction, doc, Timestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import { z } from 'zod';
import { TransactionInput } from './transactions.service';

export const InventoryCategories = ['Feed', 'Vaccine', 'Medicine', 'Chicks', 'Other'] as const;
export type InventoryCategory = typeof InventoryCategories[number];

export const InventoryItemSchema = z.object({
  name: z.string().min(1, { message: "Item name is required." }),
  category: z.enum(InventoryCategories),
  quantity: z.number().min(0, { message: "Quantity cannot be negative." }),
  originalQuantity: z.number().min(0).optional(), // New field
  unit: z.string().min(1, { message: "Unit is required." }),
  purchasePrice: z.number().min(0, { message: "Purchase price must be positive." }).optional(),
  salesPrice: z.number().min(0, { message: "Sales price must be positive." }).optional(),
  gstRate: z.number().min(0, "GST rate cannot be negative.").optional(),
  purchaseSource: z.string().optional(),
  ownerId: z.string(), // The ID of the farmer or dealer who owns this item
  createdAt: z.any(),
  purchaseOrderId: z.string().optional(),
});

export type InventoryItem = z.infer<typeof InventoryItemSchema> & { id: string, createdAt: { seconds: number, nanoseconds: number } };
export type InventoryItemInput = z.infer<typeof InventoryItemSchema>;

export const createPurchaseOrder = async (
    itemsData: Omit<InventoryItemInput, 'createdAt' | 'purchaseOrderId' | 'ownerId' | 'originalQuantity'>[],
    orderDate: Date,
    paymentDetails?: {
        amount: number;
        date: Date;
        method: 'Cash' | 'Bank Transfer' | 'Credit' | 'UPI' | 'RTGS' | 'NEFT';
        reference?: string;
        remarks?: string;
    },
    additionalCosts?: { description: string, amount: number, paidTo?: string, paymentMethod?: 'Cash' | 'Bank Transfer' | 'UPI' | 'RTGS' | 'NEFT' }[],
    purchaseSource?: string,
    ownerId?: string,
) => {
    const db = getFirestore(app);
    if (!ownerId) {
        throw new Error("Owner ID is required to create a purchase order.");
    }
    
    const purchaseOrderRef = doc(collection(db, 'purchaseOrders'));
    const purchaseOrderId = purchaseOrderRef.id;

    await runTransaction(db, async (transaction) => {
        // --- All READ operations must happen before any WRITE operations ---

        // There are no reads required in this specific transaction logic,
        // so we can proceed directly to writes.

        // --- All WRITE operations happen after reads ---

        // 1. Create a record of the purchase order itself
        transaction.set(purchaseOrderRef, {
            ownerId,
            createdAt: serverTimestamp(),
            orderDate: Timestamp.fromDate(orderDate),
            itemCount: itemsData.length,
            purchaseSource: purchaseSource || 'Unknown Supplier',
        });

        // 2. Create each inventory item
        itemsData.forEach(itemData => {
            const newItemRef = doc(collection(db, 'inventory'));
            const validatedItemData = InventoryItemSchema.omit({ createdAt: true, ownerId: true, purchaseOrderId: true, originalQuantity: true }).parse({
                ...itemData,
                purchaseSource,
            });
            transaction.set(newItemRef, {
                ...validatedItemData,
                originalQuantity: validatedItemData.quantity, // Set original quantity on creation
                ownerId,
                purchaseOrderId,
                createdAt: Timestamp.fromDate(orderDate)
            });
        });
        
        // 3. Create transactions for additional costs
        if (additionalCosts) {
            additionalCosts.forEach(cost => {
                if(cost.amount > 0 && cost.paidTo) {
                    const costTransaction: Omit<TransactionInput, 'createdAt'> = {
                        date: orderDate,
                        description: cost.description,
                        amount: -Math.abs(cost.amount), // Expense is a negative amount
                        status: 'Paid',
                        userId: ownerId, // The user is the dealer themselves
                        userName: cost.paidTo,
                        dealerId: ownerId,
                        isBusinessExpense: true,
                        purchaseOrderId,
                        paymentMethod: cost.paymentMethod,
                        remarks: `Associated with PO #${purchaseOrderId.substring(0,5)}`
                    };
                     const newTransactionRef = doc(collection(db, 'transactions'));
                     transaction.set(newTransactionRef, {
                        ...costTransaction,
                        date: Timestamp.fromDate(costTransaction.date),
                        createdAt: serverTimestamp()
                    });
                }
            });
        }

        // 4. Create a single payment transaction for the whole order to the supplier
        if (paymentDetails && purchaseSource && paymentDetails.method !== 'Credit' && paymentDetails.amount > 0) {
            const transactionInput: Omit<TransactionInput, 'createdAt'> = {
                date: paymentDetails.date,
                description: `Payment for Purchase Order #${purchaseOrderId.substring(0, 5)}`,
                amount: -Math.abs(paymentDetails.amount),
                status: 'Paid',
                userId: ownerId, 
                userName: purchaseSource, // This payment is TO the supplier
                dealerId: ownerId,
                paymentMethod: paymentDetails.method,
                referenceNumber: paymentDetails.reference || null,
                remarks: paymentDetails.remarks || null,
                purchaseOrderId: purchaseOrderId,
                isBusinessExpense: true,
            };

            const newTransactionRef = doc(collection(db, 'transactions'));
            transaction.set(newTransactionRef, {
                ...transactionInput,
                date: Timestamp.fromDate(transactionInput.date),
                createdAt: serverTimestamp()
            });
        }
    });

    return { purchaseOrderId };
};


export const getInventoryItems = (ownerId: string, callback: (items: InventoryItem[]) => void): Unsubscribe => {
  const db = getFirestore(app);
  const q = query(collection(db, 'inventory'), where("ownerId", "==", ownerId));

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const items: InventoryItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as InventoryItem);
    });
    callback(items);
  });
};

export const getUniquePurchaseSources = async (ownerId: string): Promise<string[]> => {
    const db = getFirestore(app);
    const q = query(collection(db, 'inventory'), where("ownerId", "==", ownerId));
    const snapshot = await getDocs(q);
    const sources = new Set<string>();
    snapshot.forEach(doc => {
        const item = doc.data() as InventoryItem;
        if (item.purchaseSource) {
            sources.add(item.purchaseSource);
        }
    });
    return Array.from(sources);
}

export const getInventoryItemsByPurchaseSource = async (ownerId: string, purchaseSource: string): Promise<InventoryItem[]> => {
    const db = getFirestore(app);
    const q = query(
        collection(db, 'inventory'), 
        where("ownerId", "==", ownerId),
        where("purchaseSource", "==", purchaseSource),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const items: InventoryItem[] = [];
    snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as InventoryItem);
    });
    return items;
};

export const deletePurchaseOrder = async (purchaseOrderId: string) => {
    const db = getFirestore(app);
    const batch = writeBatch(db);

    // 1. Delete the Purchase Order document
    const poRef = doc(db, 'purchaseOrders', purchaseOrderId);
    batch.delete(poRef);

    // 2. Find and delete all inventory items associated with this PO
    const inventoryQuery = query(collection(db, 'inventory'), where('purchaseOrderId', '==', purchaseOrderId));
    const inventorySnap = await getDocs(inventoryQuery);
    inventorySnap.forEach(doc => batch.delete(doc.ref));

    // 3. Find and delete all transactions (payments, expenses) associated with this PO
    const transactionQuery = query(collection(db, 'transactions'), where('purchaseOrderId', '==', purchaseOrderId));
    const transactionSnap = await getDocs(transactionQuery);
    transactionSnap.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
}
