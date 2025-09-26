
// src/services/billing.service.ts
import { getFirestore, Firestore } from 'firebase/firestore';
import { collection, addDoc, query, where, onSnapshot, DocumentData, Unsubscribe, serverTimestamp, doc, updateDoc, writeBatch, orderBy } from 'firebase/firestore';
import { z } from 'zod';
import { createNotification } from './notifications.service';
import { updateUserPremiumStatus } from './users.service';

export const PaymentVerificationRequestSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string().email(),
  amount: z.number(),
  planType: z.string(),
  referenceNumber: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  createdAt: z.any(),
  reason: z.string().optional(),
  promoCode: z.string().nullable().optional(),
  discountedAmount: z.number().optional(),
});

export type PaymentVerificationRequest = z.infer<typeof PaymentVerificationRequestSchema> & {
    id: string;
    createdAt: { seconds: number, nanoseconds: number };
};

/**
 * Creates a new payment verification request from a user.
 */
export const createPaymentVerificationRequest = async (
  db: Firestore,
  requestData: Omit<PaymentVerificationRequest, 'id' | 'status' | 'createdAt' | 'reason'>
): Promise<string> => {
  const validatedData = PaymentVerificationRequestSchema.omit({ id: true, status: true, createdAt: true, reason: true }).parse(requestData);
  const docRef = await addDoc(collection(db, 'paymentVerifications'), {
    ...validatedData,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  
  // Notify admin - in a real app, this would target a specific admin group
  // For now, let's assume we have a way to find admins or a fixed admin ID
  // This part is for demonstration and might need a more robust implementation
  
  return docRef.id;
};


/**
 * Gets all pending verification requests for the admin.
 */
export const getPendingPaymentVerifications = (
  db: Firestore,
  callback: (requests: PaymentVerificationRequest[]) => void
): Unsubscribe => {
  const q = query(collection(db, 'paymentVerifications'), where('status', '==', 'pending'), orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PaymentVerificationRequest));
    callback(requests);
  });
};


/**
 * Approves a payment request, updating the request and the user's premium status.
 */
export const approvePaymentVerification = async (db: Firestore, requestId: string, userId: string, reason: string): Promise<void> => {
  const requestRef = doc(db, 'paymentVerifications', requestId);
  
  // We are not using a batch here because updateUserPremiumStatus is a separate service call
  // which might have its own transaction logic.
  
  // 1. Update the request status and reason
  await updateDoc(requestRef, { status: 'approved', reason: reason });

  // 2. Update the user's premium status (using the function from users.service)
  await updateUserPremiumStatus(db, userId, true);

  // 3. Notify the user
  await createNotification(db, {
    userId: userId,
    title: 'Subscription Activated!',
    message: `Your premium plan is now active. Admin comment: ${reason}`,
    type: 'announcement', // Using announcement for high visibility
    link: '/dashboard',
  });
};


/**
 * Rejects a payment request.
 */
export const rejectPaymentVerification = async (db: Firestore, requestId: string, reason: string, userId: string): Promise<void> => {
    const requestRef = doc(db, 'paymentVerifications', requestId);
    await updateDoc(requestRef, { status: 'rejected', reason: reason });
    
    // Notify the user of rejection with a reason.
     await createNotification(db, {
        userId: userId,
        title: 'Payment Verification Failed',
        message: `Your recent payment could not be verified. Reason: ${reason}`,
        type: 'announcement', // High visibility
        link: '/settings/billing',
    });
};
