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
  getDocs,
} from 'firebase/firestore';
import { Message } from 'genkit';
import { db } from '@/lib/firebase';

/**
 * Fetches the chat history for a specific user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of messages.
 */
export const getChatHistory = async (userId: string): Promise<Message[]> => {
  const messagesCol = collection(db, 'chats', userId, 'messages');
  const q = query(messagesCol, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  
  const messages = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Genkit's `Message` type doesn't have a `createdAt` field,
      // so we just reconstruct the message, excluding extra fields.
      return {
          role: data.role,
          content: data.content,
      } as Message;
  });
  return messages;
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
