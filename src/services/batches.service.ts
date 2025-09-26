// src/services/batches.service.ts
import { getFirestore, Firestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, DocumentData, QuerySnapshot, Unsubscribe, serverTimestamp, doc, updateDoc, deleteDoc, writeBatch, getDocs, getCountFromServer, orderBy } from 'firebase/firestore';
import { z } from 'zod';
import { getUserProfile } from './users.service';

const db = getFirestore(app);

export const BatchSchema = z.object({
    name: z.string().min(1, { message: "Batch name is required." }),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
    initialBirdCount: z.number().min(1, { message: "Bird count must be at least 1." }),
    farmerId: z.string(),
    createdAt: z.any(),
});

export type Batch = z.infer<typeof BatchSchema> & {
    id: string;
    createdAt: { seconds: number, nanoseconds: number };
};
export type BatchInput = z.infer<typeof BatchSchema>;

export const createBatch = async (batchData: Omit<BatchInput, 'createdAt'>): Promise<string> => {
    const userProfile = await getUserProfile(db, batchData.farmerId);
    if (!userProfile) {
        throw new Error("User profile not found.");
    }

    if (!userProfile.isPremium && userProfile.role !== 'dealer') {
        const q = query(collection(db, 'batches'), where("farmerId", "==", batchData.farmerId));
        const snapshot = await getCountFromServer(q);
        if (snapshot.data().count >= 1) {
            throw new Error("Free plan is limited to 1 batch. Please upgrade to a premium account to create more batches.");
        }
    }

    const validatedData = BatchSchema.omit({ createdAt: true }).parse(batchData);

    const docRef = await addDoc(collection(db, 'batches'), {
        ...validatedData,
        createdAt: serverTimestamp()
    });
    return docRef.id;
};


export const getBatchesByFarmer = (farmerId: string, callback: (batches: Batch[]) => void): Unsubscribe => {
    const q = query(collection(db, 'batches'), where("farmerId", "==", farmerId), orderBy("startDate", "desc"));
    
    return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
        const batches: Batch[] = [];
        querySnapshot.forEach((doc) => {
            batches.push({ id: doc.id, ...doc.data() } as Batch);
        });
        callback(batches);
    });
};

export const updateBatch = async (batchId: string, data: { name?: string; startDate?: string }) => {
    const batchRef = doc(db, 'batches', batchId);
    await updateDoc(batchRef, data);
};

export const deleteBatch = async (db: Firestore, batchId: string) => {
    const batchRef = doc(db, 'batches', batchId);
    
    // Also delete associated daily entries
    const entriesQuery = query(collection(db, 'daily-entries'), where("batchId", "==", batchId));
    const entriesSnapshot = await getDocs(entriesQuery);
    
    const batchWriter = writeBatch(db);
    entriesSnapshot.forEach(doc => {
        batchWriter.delete(doc.ref);
    });
    
    await batchWriter.commit();
    
    // Finally, delete the batch itself
    await deleteDoc(batchRef);
};
