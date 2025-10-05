// src/services/notifications.service.ts
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
  serverTimestamp,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
  getDocs,
  doc,
  Firestore,
} from 'firebase/firestore';
import { z } from 'zod';
import { getAllUsers } from './users.service';

export const NotificationTypeSchema = z.enum([
  'announcement',
  'order_status',
  'new_order',
  'new_payment',
  'connection_request',
  'connection_accepted',
]);

export const NotificationSchema = z.object({
  userId: z.string(), // The user who receives the notification
  title: z.string(),
  message: z.string(),
  type: NotificationTypeSchema,
  isRead: z.boolean().default(false),
  link: z.string().optional(), // e.g., /orders/xyz
  createdAt: z.any(),
});

export type AppNotification = z.infer<typeof NotificationSchema> & { id: string, createdAt: Timestamp };
export type NotificationInput = z.infer<typeof NotificationSchema>;

/**
 * Creates a single notification for a specific user.
 */
export const createNotification = async (
  db: Firestore,
  notificationData: Omit<NotificationInput, 'createdAt' | 'isRead'>
): Promise<string> => {
  const validatedData = NotificationSchema.omit({ createdAt: true, isRead: true }).parse(notificationData);
  const docRef = await addDoc(collection(db, 'notifications'), {
    ...validatedData,
    isRead: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Creates an announcement notification for all users.
 */
export const createAnnouncement = async (db: Firestore, title: string, message: string, link?: string): Promise<void> => {
    const allUsers = await getAllUsers();
    const batch = writeBatch(db);

    allUsers.forEach(user => {
        const newNotifRef = doc(collection(db, 'notifications'));
        const notificationData: Omit<NotificationInput, 'createdAt' | 'isRead'> = {
            userId: user.uid,
            title,
            message,
            type: 'announcement',
            link: link || '/dashboard'
        };
        batch.set(newNotifRef, {
            ...notificationData,
            isRead: false,
            createdAt: serverTimestamp(),
        })
    });

    await batch.commit();
}


/**
 * Fetches notifications for a specific user.
 */
export const getNotifications = (
  db: Firestore,
  userId: string,
  callback: (notifications: AppNotification[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications: AppNotification[] = [];
    snapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() } as AppNotification);
    });
    callback(notifications);
  });
};

/**
 * Marks all unread notifications for a user as read.
 */
export const markNotificationsAsRead = async (db: Firestore, userId: string): Promise<void> => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return;
  }

  const batch = writeBatch(db);
  snapshot.forEach((doc) => {
    batch.update(doc.ref, { isRead: true });
  });

  await batch.commit();
};
