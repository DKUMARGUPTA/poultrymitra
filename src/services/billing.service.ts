// src/services/billing.service.ts
import { collection, addDoc, query, where, onSnapshot, DocumentData, Unsubscribe, serverTimestamp, doc, updateDoc, writeBatch, orderBy, Firestore, QuerySnapshot, getDocs } from 'firebase/firestore';
import { z } from 'zod';
import { createNotification } from './notifications.service';
import { updateUserPremiumStatus } from './users.service';
import { db } from '@/lib/firebase';

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
export const getPendingPaymentVerifications = async (): Promise<PaymentVerificationRequest[]> => {
  const q = query(collection(db, 'paymentVerifications'), where('status', '==', 'pending'), orderBy('createdAt', 'asc'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as PaymentVerificationRequest));
};


/**
 * Approves a payment request, updating the request and the user's premium status.
 */
export const approvePaymentVerification = async (requestId: string, userId: string, reason: string): Promise<void> => {
  const requestRef = doc(db, 'paymentVerifications', requestId);
  
  // 1. Update the request status and reason
  await updateDoc(requestRef, { status: 'approved', reason: reason });

  // 2. Update the user's premium status
  await updateUserPremiumStatus(userId, true);

  // 3. Notify the user
  await createNotification({
    userId: userId,
    title: 'Subscription Activated!',
    message: `Your premium plan is now active. Admin comment: ${reason}`,
    type: 'announcement',
    link: '/dashboard',
  });
};


/**
 * Rejects a payment request.
 */
export const rejectPaymentVerification = async (requestId: string, reason: string, userId: string): Promise<void> => {
    const requestRef = doc(db, 'paymentVerifications', requestId);
    await updateDoc(requestRef, { status: 'rejected', reason: reason });
    
    // Notify the user of rejection with a reason.
     await createNotification({
        userId: userId,
        title: 'Payment Verification Failed',
        message: `Your recent payment could not be verified. Reason: ${reason}`,
        type: 'announcement',
        link: '/settings/billing',
    });
};
