// src/services/offers.service.ts
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  Timestamp,
  limit,
  getDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { z } from 'zod';
import { db } from '@/lib/firebase';

export const OfferSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters.').max(20, 'Code can be at most 20 characters.'),
  discountPercentage: z.number().min(1, 'Discount must be at least 1%.').max(100, 'Discount cannot exceed 100%.'),
  expiresAt: z.date(),
  createdAt: z.any().optional(),
  isActive: z.boolean().default(true),
});

export type SubscriptionOffer = z.infer<typeof OfferSchema> & { id: string, createdAt: Timestamp };
export type OfferInput = z.infer<typeof OfferSchema>;

export const createOffer = async (offerData: Omit<OfferInput, 'createdAt' | 'isActive'>): Promise<string> => {
  const codeUpper = offerData.code.toUpperCase();
  const existingQuery = query(collection(db, 'offers'), where('code', '==', codeUpper));
  const existingSnap = await getDocs(existingQuery);
  if (!existingSnap.empty) {
    throw new Error(`An offer with the code "${codeUpper}" already exists.`);
  }

  const validatedData = OfferSchema.omit({ createdAt: true, isActive: true }).parse({
    ...offerData,
    code: codeUpper,
  });

  const docRef = await addDoc(collection(db, 'offers'), {
    ...validatedData,
    expiresAt: Timestamp.fromDate(validatedData.expiresAt),
    createdAt: serverTimestamp(),
    isActive: true,
  });
  return docRef.id;
};

export const getActiveOffers = (callback: (offers: SubscriptionOffer[]) => void) => {
    const q = query(
        collection(db, 'offers'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
        const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionOffer));
        callback(offers);
    });
};

export const getActiveOffersAsync = async (): Promise<SubscriptionOffer[]> => {
    const q = query(
        collection(db, 'offers'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionOffer));
};

export const getOfferByCode = async (code: string): Promise<SubscriptionOffer | null> => {
    if (!code) return null;
    const q = query(collection(db, 'offers'), where('code', '==', code.toUpperCase()), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }
    const offerDoc = snapshot.docs[0];
    const offerData = offerDoc.data() as SubscriptionOffer;

    if (!offerData.isActive || offerData.expiresAt.toDate() < new Date()) {
        return null; // Offer is expired or inactive
    }

    return { id: offerDoc.id, ...offerData };
}
