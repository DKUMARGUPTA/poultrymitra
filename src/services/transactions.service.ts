// src/services/transactions.service.ts
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  runTransaction,
  increment,
  Timestamp,
  deleteDoc,
  getDoc,
  updateDoc,
  Firestore,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { z } from 'zod';
import { createNotification } from './notifications.service';

export const TransactionSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
    invalid_type_error: "That's not a valid date!",
  }),
  description: z.string().min(1, { message: "Description is required." }),
  amount: z.number(),
  status: z.enum(['Paid', 'Pending']),
  userId: z.string(), // ID of the farmer or user who made the transaction
  userName: z.string(), // Name of the farmer or user OR supplier name
  dealerId: z.string(), // ID of the dealer associated with the transaction
  inventoryItemId: z.string().optional(),
  inventoryItemName: z.string().optional(),
  quantitySold: z.number().optional(),
  totalWeight: z.number().optional(), // New field for sale logging
  costOfGoodsSold: z.number().optional(),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Credit', 'UPI', 'RTGS', 'NEFT']).optional(),
  referenceNumber: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  purchaseOrderId: z.string().optional(), // Used for orders FROM dealers TO farmers
  batchId: z.string().optional(), // Used for sales FROM farmers
  isBusinessExpense: z.boolean().optional(), // To flag transactions like transport cost
});

export type Transaction = z.infer<typeof TransactionSchema> & { 
  id: string;
  date: any; // Firestore returns a Timestamp, which is not a JS Date
};
export type TransactionInput = z.infer<typeof TransactionSchema>;

// Function to create a new transaction
export const createTransaction = async (db: Firestore, transactionData: TransactionInput) => {
    const validatedData = TransactionSchema.parse(transactionData);
    
    await runTransaction(db, async (t) => {
        // --- All READ operations must happen before any WRITE operations ---
        let farmerRef: any;
        let inventoryRef: any;
        let inventoryDoc: any;
        let costOfGoodsSold: number | undefined = undefined;

        // Read farmer doc if it's a farmer-specific transaction (NOT a general business expense)
        if (validatedData.userId && !validatedData.isBusinessExpense && validatedData.userId !== validatedData.dealerId) {
            farmerRef = doc(db, 'farmers', validatedData.userId);
            const farmerDoc = await t.get(farmerRef);
             if (!farmerDoc.exists()) {
                throw new Error("Farmer profile could not be found.");
            }
        }

        // Read inventory doc if it's a sale
        if (validatedData.inventoryItemId && validatedData.quantitySold && validatedData.quantitySold > 0) {
            inventoryRef = doc(db, 'inventory', validatedData.inventoryItemId);
            inventoryDoc = await t.get(inventoryRef);
            if (!inventoryDoc.exists()) {
                throw new Error("Inventory item not found.");
            }
            const currentQuantity = inventoryDoc.data().quantity;
            if (currentQuantity < validatedData.quantitySold) {
                throw new Error(`Not enough stock for ${inventoryDoc.data().name}. Only ${currentQuantity} available.`);
            }
            costOfGoodsSold = (inventoryDoc.data().purchasePrice || 0) * validatedData.quantitySold;
        }

        // --- All WRITE operations happen after reads ---

        // 1. Create the transaction document
        const newTransactionRef = doc(collection(db, "transactions"));
        const dataToSave: any = {
            ...validatedData,
            costOfGoodsSold, // Ensure COGS is included here
            referenceNumber: validatedData.referenceNumber || null,
            remarks: validatedData.remarks || null,
            date: Timestamp.fromDate(validatedData.date),
            createdAt: serverTimestamp()
        };
        // Remove undefined keys to keep Firestore clean
        Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);


        t.set(newTransactionRef, dataToSave);

        // 2. Update the farmer's outstanding balance (if applicable)
        if (farmerRef) {
            t.update(farmerRef, { outstanding: increment(validatedData.amount) });
        }

        // 3. If it's a sale, update inventory
        if (inventoryRef && validatedData.quantitySold) {
            t.update(inventoryRef, { quantity: increment(-validatedData.quantitySold) });
        }
    });

    // 4. Send notification (outside the transaction, if applicable)
    if (validatedData.userId && !validatedData.isBusinessExpense && validatedData.userId !== validatedData.dealerId) {
        const isSale = validatedData.amount > 0;
        const notificationTitle = isSale ? "New Sale Logged" : "Payment Received";
        const notificationMessage = isSale
            ? `A new sale of ₹${validatedData.amount.toLocaleString()} has been added to your ledger.`
            : `Your payment of ₹${Math.abs(validatedData.amount).toLocaleString()} has been logged by your dealer.`;
        
        await createNotification({
            userId: validatedData.userId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'new_payment',
            link: '/ledger'
        });
    }
};

export const updateTransaction = async (db: Firestore, transactionId: string, updatedData: Partial<TransactionInput>) => {
    const transactionRef = doc(db, 'transactions', transactionId);

    await runTransaction(db, async (t) => {
        const transactionDoc = await t.get(transactionRef);
        if (!transactionDoc.exists()) {
            throw new Error("Transaction not found.");
        }
        const oldTransactionData = transactionDoc.data() as Transaction;
        
        // --- All WRITES second ---
        // 1. Update the transaction document
        const dataToUpdate: any = { ...updatedData };
        if(updatedData.date) {
            dataToUpdate.date = Timestamp.fromDate(updatedData.date);
        }
        t.update(transactionRef, dataToUpdate);

        // 2. Reverse the old outstanding balance and apply the new one, if it has changed and is applicable.
        const hasChanged = updatedData.amount !== undefined && updatedData.amount !== oldTransactionData.amount;
        if (hasChanged && oldTransactionData.userId && !oldTransactionData.isBusinessExpense && oldTransactionData.userId !== oldTransactionData.dealerId) {
            const farmerRef = doc(db, 'farmers', oldTransactionData.userId);
            const amountDifference = updatedData.amount! - oldTransactionData.amount;
            t.update(farmerRef, { outstanding: increment(amountDifference) });
        }
    });
};


export const deleteTransaction = async (db: Firestore, transactionId: string) => {
    const transactionRef = doc(db, 'transactions', transactionId);

    await runTransaction(db, async (t) => {
        const transactionDoc = await t.get(transactionRef);
        if (!transactionDoc.exists()) {
            throw new Error("Transaction not found.");
        }
        const transactionData = transactionDoc.data() as Transaction;
        
        // --- All READS first ---
        let farmerRef;
        if (transactionData.userId && transactionData.userId !== transactionData.dealerId && !transactionData.isBusinessExpense) {
            farmerRef = doc(db, 'farmers', transactionData.userId);
            // We get the doc to ensure it exists before trying to update it, though we don't use the data.
            await t.get(farmerRef); 
        }

        // --- All WRITES second ---
        // 1. Delete the transaction document
        t.delete(transactionRef);

        // 2. Reverse the farmer's outstanding balance update
        if (farmerRef) {
             // To reverse the original operation, we increment by the negative of the original amount.
            t.update(farmerRef, { outstanding: increment(-transactionData.amount) });
        }

        // 3. If it was a sale, restore the inventory
        if (transactionData.inventoryItemId && transactionData.quantitySold && transactionData.quantitySold > 0) {
            const inventoryRef = doc(db, 'inventory', transactionData.inventoryItemId);
            // We don't need to get the doc here, just increment. If the doc was deleted, this will fail, which is okay.
            t.update(inventoryRef, { quantity: increment(transactionData.quantitySold) });
        }
    });
};


const processTransactionDoc = (doc: DocumentData): Transaction => {
    const data = doc.data();
    const date = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
    return {
        id: doc.id,
        ...data,
        date: date.toISOString(),
    } as Transaction;
};

// Function to get transactions for a user (either a farmer or a dealer) - one-time fetch
export const getTransactionsForUser = (db: Firestore, uid: string, callback: (transactions: Transaction[]) => void, isDealerView: boolean = false): Unsubscribe => {
    const transactionsCollection = collection(db, 'transactions');
    let q;
    if (isDealerView) {
        q = query(
            transactionsCollection,
            where('dealerId', '==', uid),
            orderBy('date', 'desc'),
            limit(50)
        );
    } else {
        q = query(
            transactionsCollection,
            where('userId', '==', uid),
            orderBy('date', 'desc'),
            limit(50)
        );
    }
  
    return onSnapshot(q, (querySnapshot) => {
        const transactions = querySnapshot.docs.map(doc => processTransactionDoc(doc));
        callback(transactions);
    });
};

export const getBusinessExpenses = async (db: Firestore, dealerId: string): Promise<Transaction[]> => {
    const transactionsCollection = collection(db, 'transactions');
    const q = query(
        transactionsCollection,
        where('dealerId', '==', dealerId),
        where('isBusinessExpense', '==', true),
        orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => processTransactionDoc(doc));
};


export const getAllTransactions = async (db: Firestore): Promise<Transaction[]> => {
    const transactionsCollection = collection(db, 'transactions');
    const q = query(
        transactionsCollection,
        orderBy('date', 'desc'),
        limit(100) // Limit to the last 100 global transactions
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => processTransactionDoc(doc));
};


export const getTransactionsForFarmer = (db: Firestore, farmerId: string, callback: (transactions: Transaction[]) => void): Unsubscribe => {
    const transactionsCollection = collection(db, 'transactions');
    const q = query(transactionsCollection, where("userId", "==", farmerId), orderBy('date', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
        const transactions = querySnapshot.docs.map(processTransactionDoc);
        callback(transactions);
    });
}

export const getTransactionsForBatch = (db: Firestore, batchId: string, callback: (transactions: Transaction[]) => void): Unsubscribe => {
    const transactionsCollection = collection(db, 'transactions');
    const q = query(
        transactionsCollection,
        where("batchId", "==", batchId),
        orderBy('date', 'desc'),
    );
    
    return onSnapshot(q, (querySnapshot) => {
        const transactions = querySnapshot.docs.map(processTransactionDoc);
        callback(transactions);
    });
};


export const getSupplierPayments = async (db: Firestore, dealerId: string, supplierName: string): Promise<Transaction[]> => {
  const transactionsCollection = collection(db, 'transactions');
  const q = query(
    transactionsCollection,
    where('dealerId', '==', dealerId),
    where('userName', '==', supplierName),
    where('isBusinessExpense', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(processTransactionDoc);
}
