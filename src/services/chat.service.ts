// src/services/chat.service.ts
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { Message } from 'genkit';
import { db } from '@/lib/firebase';

/**
 * Subscribes to the chat history for a specific user.
 * @param userId The ID of the user.
 * @param callback A function to call with the updated messages.
 * @returns An unsubscribe function.
 */
export const getChatHistory = (
  userId: string,
  callback: (messages: Message[]) => void
): Unsubscribe => {
  const messagesCol = collection(db, 'chats', userId, 'messages');
  const q = query(messagesCol, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Firestore Timestamps need to be handled carefully.
        // Genkit's `Message` type doesn't have a `createdAt` field,
        // so we just reconstruct the message.
        return data as Message;
    });
    callback(messages);
  });
};

/**
 * Adds a new message to a user's chat history.
 * @param userId The ID of the user.
 * @param message The Genkit Message object to save.
 */
export const addChatMessage = async (
  userId: string,
  message: Message
): Promise<void> => {
  const messagesCol = collection(db, 'chats', userId, 'messages');
  await addDoc(messagesCol, {
    ...message,
    createdAt: serverTimestamp(),
  });
};
