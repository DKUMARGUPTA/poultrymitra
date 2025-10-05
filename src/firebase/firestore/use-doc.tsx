// src/firebase/firestore/use-doc.tsx
'use client';

import { onSnapshot, doc, DocumentData, Unsubscribe } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirebase } from '../provider';

export function useDoc<T>(
  collectionName: string,
  docId: string
): { data: T | null; loading: boolean } {
  const { db } = useFirebase();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !docId) {
        setLoading(false);
        setData(null);
        return;
    };

    const docRef = doc(db, collectionName, docId);
    setLoading(true);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData({ id: docSnap.id, ...docSnap.data() } as T);
      } else {
        setData(null);
      }
      setLoading(false);
    }, (error) => {
        console.error(`Error fetching document ${collectionName}/${docId}:`, error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, collectionName, docId]);

  return { data, loading };
}
