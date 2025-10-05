// src/services/connection.service.ts
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  writeBatch,
  serverTimestamp,
  updateDoc,
  Timestamp,
  getDoc,
  DocumentData,
  getDocs
} from 'firebase/firestore';
import { z } from 'zod';
import { createNotification } from './notifications.service';
import { getUserProfile, UserProfile } from './users.service';
import { db } from '@/lib/firebase';

const ConnectionRequestSchema = z.object({
  requesterId: z.string(),
  recipientId: z.string(),
  status: z.enum(['pending', 'accepted', 'rejected']),
  createdAt: z.any(),
});

export type ConnectionRequest = z.infer<typeof ConnectionRequestSchema> & {
    id: string;
    requesterProfile: UserProfile;
};

/**
 * Creates a connection request from a farmer to a dealer.
 */
export const createConnectionRequest = async (requesterId: string, recipientId: string): Promise<void> => {
  await addDoc(collection(db, 'connectionRequests'), {
    requesterId,
    recipientId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  // Notify the dealer
  await createNotification({
    userId: recipientId,
    title: 'New Connection Request',
    message: 'A farmer wants to connect with you.',
    type: 'connection_request',
    link: '/dashboard', // Dealer can see requests on their dashboard
  });
};

/**
 * Fetches pending connection requests for a dealer.
 */
export const getConnectionRequestsForDealer = async (dealerId: string): Promise<ConnectionRequest[]> => {
  const q = query(
    collection(db, 'connectionRequests'),
    where('recipientId', '==', dealerId),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  const requestsPromises = snapshot.docs.map(async (docSnap) => {
    const requestData = docSnap.data() as DocumentData;
    const requesterProfile = await getUserProfile(requestData.requesterId);
    return {
      id: docSnap.id,
      ...requestData,
      requesterProfile,
    } as ConnectionRequest;
  });

  return (await Promise.all(requestsPromises)).filter(r => r.requesterProfile !== null);
};

/**
 * Accepts a connection request.
 */
export const acceptConnectionRequest = async (requestId: string, farmerId: string, dealerId: string): Promise<void> => {
  const dealerProfile = await getUserProfile(dealerId);
  const farmerProfile = await getUserProfile(farmerId);
  
  if (!dealerProfile || !farmerProfile) {
    throw new Error("Could not find user profiles for this connection.");
  }

  const batch = writeBatch(db);

  // 1. Update request status
  batch.update(doc(db, 'connectionRequests', requestId), { status: 'accepted' });

  // 2. Update farmer's UserProfile with dealerCode
  batch.update(doc(db, 'users', farmerId), { dealerCode: dealerId });
  
  // 3. Update the corresponding Farmer document's dealerId
  const farmerDocRef = doc(db, 'farmers', farmerId);
  batch.update(farmerDocRef, { dealerId: dealerId });

  await batch.commit();

  // 4. Send notifications
  await createNotification({
    userId: farmerId,
    title: 'Connection Accepted',
    message: `You are now connected with dealer ${dealerProfile.name}.`,
    type: 'connection_accepted',
    link: '/dashboard',
  });
   await createNotification({
    userId: dealerId,
    title: 'Connection Established',
    message: `You are now connected with farmer ${farmerProfile.name}.`,
    type: 'connection_accepted',
    link: `/farmers/${farmerId}`,
  });
};

/**
 * Rejects a connection request.
 */
export const rejectConnectionRequest = async (requestId: string, farmerId: string): Promise<void> => {
    const requestRef = doc(db, 'connectionRequests', requestId);
    await updateDoc(requestRef, { status: 'rejected' });

    await createNotification({
        userId: farmerId,
        title: 'Connection Rejected',
        message: 'Your connection request was rejected by the dealer.',
        type: 'connection_request', // Re-using for simplicity, could be a new type
        link: '/dashboard',
    });
};
