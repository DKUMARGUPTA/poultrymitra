// src/services/farmers.service.ts
import { collection, addDoc, query, where, onSnapshot, DocumentData, QuerySnapshot, Unsubscribe, doc, getDoc, updateDoc, increment, getDocs, setDoc, getCountFromServer } from 'firebase/firestore';
import { z } from 'zod';
import { generateAlphanumericCode } from '@/lib/utils';
import { getUserProfile } from './users.service';
import { useFirestore } from '@/firebase/provider';

export const FarmerSchema = z.object({
    uid: z.string(), // This should match the User's UID if they have an account, or be the doc ID if not.
    name: z.string().min(1, { message: "Name is required." }),
    location: z.string().min(1, { message: "Location is required." }),
    batchSize: z.number().min(1, { message: "Batch size must be at least 1." }),
    dealerId: z.string(),
    outstanding: z.number().default(0),
    isPlaceholder: z.boolean().default(false), // True if created by a dealer and not yet linked to a user
    farmerCode: z.string().optional(), // The unique code for this farmer profile
});

export type Farmer = z.infer<typeof FarmerSchema> & { id: string };
export type FarmerInput = z.infer<typeof FarmerSchema>;

export const createFarmer = async (farmerData: Partial<FarmerInput>, isPlaceholder: boolean = false): Promise<string> => {
    const db = useFirestore();
    if (isPlaceholder) {
        if (!farmerData.dealerId) throw new Error("Dealer ID is required for placeholder farmers.");

        const dealerProfile = await getUserProfile(farmerData.dealerId);
        if (!dealerProfile) throw new Error("Dealer profile not found.");

        if (!dealerProfile.isPremium) {
            const q = query(collection(db, 'farmers'), where("dealerId", "==", farmerData.dealerId));
            const snapshot = await getCountFromServer(q);
            if (snapshot.data().count >= 3) {
                 throw new Error("Free plan is limited to 3 farmers. Please upgrade to a premium account to add more.");
            }
        }

        const docRef = doc(collection(db, 'farmers')); // Create a new document reference to get an ID
        const farmerCode = generateAlphanumericCode(10); // Generate a unique code
        const validatedData = FarmerSchema.parse({
            ...farmerData,
            uid: docRef.id, // Placeholder UID is the doc ID
            isPlaceholder: true,
            farmerCode: farmerCode,
        });
        await setDoc(docRef, validatedData);
        return docRef.id;
    }
    
    // This path is for when a user with an account is created.
    if (!farmerData.uid) {
        throw new Error("UID is required when creating a non-placeholder farmer.");
    }
    const validatedData = FarmerSchema.parse(farmerData);
    const docRef = doc(db, 'farmers', farmerData.uid);
    await setDoc(docRef, validatedData);
    return docRef.id;
};


export const getFarmersByDealer = (dealerId: string, callback: (farmers: Farmer[]) => void): Unsubscribe => {
    const db = useFirestore();
    const q = query(collection(db, 'farmers'), where("dealerId", "==", dealerId));
    
    return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
        const farmers: Farmer[] = [];
        querySnapshot.forEach((doc) => {
            farmers.push({ id: doc.id, ...doc.data() } as Farmer);
        });
        callback(farmers);
    });
};

export const getAllFarmers = async (): Promise<Farmer[]> => {
    const db = useFirestore();
    const querySnapshot = await getDocs(collection(db, 'farmers'));
    const farmers: Farmer[] = [];
    querySnapshot.forEach((doc) => {
        farmers.push({ id: doc.id, ...doc.data() } as Farmer);
    });
    return farmers;
};


export const getFarmer = async (farmerId: string): Promise<Farmer | null> => {
    const db = useFirestore();
    const docRef = doc(db, 'farmers', farmerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Farmer;
    } else {
        console.log("No such farmer!");
        return null;
    }
};

export const updateFarmerOutstanding = async (farmerId: string, amount: number) => {
    const db = useFirestore();
    const farmerRef = doc(db, 'farmers', farmerId);
    // A sale/debit is a positive amount representing money owed.
    // A payment/credit is a negative amount.
    // So we just increment by the provided amount.
    await updateDoc(farmerRef, {
        outstanding: increment(amount)
    });
};
