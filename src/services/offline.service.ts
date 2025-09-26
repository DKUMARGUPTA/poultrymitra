// src/services/offline.service.ts
import { openDB, DBSchema } from 'dexie';

interface QueuedOperation {
  id?: number;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  docId: string; // The original or temporary ID
  timestamp: number;
}

interface AppDB extends DBSchema {
  operations: QueuedOperation;
}

const db = openDB<AppDB>('PoultryMitraDB', 1, {
    upgrade(db) {
        db.createObjectStore('operations', { autoIncrement: true });
    },
});

export async function queueOperation(type: 'create' | 'update' | 'delete', collection: string, data: any, docId: string): Promise<void> {
  await (await db).put('operations', {
    type,
    collection,
    data,
    docId,
    timestamp: Date.now(),
  });
}

export async function processQueue(firebaseDb: any, firebaseAuth: any): Promise<void> {
  const { collection, addDoc, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } = await import('firebase/firestore');

  if (!(await db).table('operations').count()) {
    return;
  }

  console.log('Processing offline queue...');
  const operations = await (await db).table('operations').orderBy('timestamp').toArray();

  for (const op of operations) {
    try {
      const collectionRef = collection(firebaseDb, op.collection);
      let docRef;

      switch (op.type) {
        case 'create':
          // If the docId was a temporary offline ID, we create a new doc.
          // Otherwise, we use the pre-defined ID (like for user-related docs).
          if (op.docId.startsWith('offline_')) {
             await addDoc(collectionRef, { ...op.data, createdAt: serverTimestamp() });
          } else {
             docRef = doc(collectionRef, op.docId);
             await setDoc(docRef, { ...op.data, createdAt: serverTimestamp() });
          }
          break;
        case 'update':
          docRef = doc(collectionRef, op.docId);
          await updateDoc(docRef, op.data);
          break;
        case 'delete':
          docRef = doc(collectionRef, op.docId);
          await deleteDoc(docRef);
          break;
      }
      // If successful, remove from queue
      await (await db).delete('operations', op.id!);
      console.log(`Processed and removed operation ${op.id}`);

    } catch (error) {
      console.error(`Failed to process operation ${op.id}:`, error);
      // Optionally, implement a retry limit or error handling strategy
    }
  }
   console.log('Offline queue processing finished.');
}
