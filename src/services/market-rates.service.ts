// src/services/market-rates.service.ts
import { collection, addDoc, query, onSnapshot, DocumentData, QuerySnapshot, Unsubscribe, serverTimestamp, orderBy, limit, getDocs, writeBatch, doc, updateDoc, deleteDoc, where, Firestore } from 'firebase/firestore';
import { z } from 'zod';
import { getClientFirestore } from '@/lib/firebase';

export const BirdSizes = ['Small', 'Medium', 'Big'] as const;
export type BirdSize = typeof BirdSizes[number];

export const MarketRateSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
    state: z.string().min(1, { message: "State is required." }),
    district: z.string().min(1, { message: "District is required." }),
    size: z.enum(BirdSizes),
    rate: z.number().min(0, { message: "Rate cannot be negative." }),
    source: z.string().optional(), // To track how the rate was added (e.g., 'admin-manual', 'dealer-manual', 'image-ai')
    addedBy: z.enum(['admin', 'dealer']).default('dealer'),
    addedByUid: z.string().optional(), // UID of the user who added the rate
    createdAt: z.any().optional(),
});

export type MarketRate = z.infer<typeof MarketRateSchema> & { id: string };
export type MarketRateInput = z.infer<typeof MarketRateSchema>;

export const createMarketRate = async (db: Firestore, rateData: Omit<MarketRateInput, 'createdAt'>): Promise<string> => {
    const validatedData = MarketRateSchema.omit({ createdAt: true }).parse({
        ...rateData,
        source: rateData.source || (rateData.addedBy === 'admin' ? 'admin-manual' : 'dealer-manual'),
    });
    const docRef = await addDoc(collection(db, 'market-rates'), {
        ...validatedData,
        createdAt: serverTimestamp()
    });
    return docRef.id;
};

export const createMarketRatesInBatch = async (ratesData: Omit<MarketRateInput, 'createdAt'>[], addedBy: 'admin' | 'dealer' = 'dealer', addedByUid?: string): Promise<void> => {
    const db = getClientFirestore();
    const batch = writeBatch(db);
    
    ratesData.forEach(rateData => {
        const validatedData = MarketRateSchema.omit({ createdAt: true }).parse({
            ...rateData,
            source: rateData.source || (addedBy === 'admin' ? 'admin-manual-bulk' : 'dealer-manual-bulk'),
            addedBy: addedBy,
            addedByUid: addedByUid,
        });
        const docRef = doc(collection(db, 'market-rates'));
        batch.set(docRef, {
            ...validatedData,
            createdAt: serverTimestamp()
        });
    });

    await batch.commit();
};

export const updateMarketRate = async (db: Firestore, rateId: string, newRate: number): Promise<void> => {
    const rateRef = doc(db, 'market-rates', rateId);
    await updateDoc(rateRef, { rate: newRate });
};

export const deleteMarketRate = async (db: Firestore, rateId: string): Promise<void> => {
    const rateRef = doc(db, 'market-rates', rateId);
    await deleteDoc(rateRef);
};


export const getMarketRates = (callback: (rates: MarketRate[]) => void): Unsubscribe => {
    const db = getClientFirestore();
    const q = query(
        collection(db, 'market-rates'),
        orderBy("date", "desc"),
        orderBy("createdAt", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
        const rates: MarketRate[] = [];
        snapshot.forEach((doc) => {
            rates.push({ id: doc.id, ...doc.data() } as MarketRate);
        });
        callback(rates);
    });
};

export const getLatestMarketRates = async (count: number): Promise<MarketRate[]> => {
    const db = getClientFirestore();
    const q = query(
        collection(db, 'market-rates'),
        orderBy("date", "desc"),
        orderBy("createdAt", "desc"),
        limit(count)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return [];
    }
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketRate));
};

export const getRatesByUser = async (userId: string, rateLimit?: number): Promise<MarketRate[]> => {
    const db = getClientFirestore();
    if (typeof userId !== 'string') {
        console.error("getRatesByUser called with invalid userId:", userId);
        return [];
    }
    let q = query(
        collection(db, 'market-rates'), 
        where('addedByUid', '==', userId), 
        orderBy('createdAt', 'desc')
    );

    if (rateLimit) {
        q = query(q, limit(rateLimit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketRate));
};
