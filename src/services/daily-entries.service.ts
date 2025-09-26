// src/services/daily-entries.service.ts
import { getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, DocumentData, QuerySnapshot, Unsubscribe, serverTimestamp, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';
import { z } from 'zod';

const db = getFirestore(app);

export const DailyEntrySchema = z.object({
    batchId: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
    mortality: z.number().int().min(0, "Mortality cannot be negative."),
    feedConsumedInKg: z.number().min(0, "Feed consumed cannot be negative."),
    averageWeightInGrams: z.number().min(0, "Average weight cannot be negative."),
    notes: z.string().optional(),
    createdAt: z.any(),
});

export type DailyEntry = z.infer<typeof DailyEntrySchema> & { id: string };
export type DailyEntryInput = z.infer<typeof DailyEntrySchema>;

export const createDailyEntry = async (entryData: Omit<DailyEntryInput, 'createdAt'>): Promise<string> => {
    const validatedData = DailyEntrySchema.omit({ createdAt: true }).parse(entryData);
    
    const docRef = await addDoc(collection(db, 'daily-entries'), {
        ...validatedData,
        createdAt: serverTimestamp()
    });
    return docRef.id;
};

export const getDailyEntriesForBatch = (batchId: string, callback: (entries: DailyEntry[]) => void): Unsubscribe => {
    const q = query(
        collection(db, 'daily-entries'), 
        where("batchId", "==", batchId),
        orderBy("date", "desc")
    );
    
    return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
        const entries: DailyEntry[] = [];
        querySnapshot.forEach((doc) => {
            entries.push({ id: doc.id, ...doc.data() } as DailyEntry);
        });
        callback(entries);
    });
};
