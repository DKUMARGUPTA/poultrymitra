// src/firebase/firestore/use-collection.tsx
'use client';

import { onSnapshot, collection, query, where, orderBy, limit, Query, CollectionReference, DocumentData, Unsubscribe } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { useFirebase } from '../provider';

interface CollectionOptions {
  sort?: { by: string; direction?: 'asc' | 'desc' };
  filter?: { field: string; op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains'; value: any };
  limit?: number;
}

export function useCollection<T>(
  collectionName: string,
  options?: CollectionOptions
): { data: T[]; loading: boolean } {
  const { db } = useFirebase();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);

  useEffect(() => {
    if (!db) return;

    let collectionRef: Query | CollectionReference = collection(db, collectionName);

    if (memoizedOptions?.filter) {
      collectionRef = query(collectionRef, where(memoizedOptions.filter.field, memoizedOptions.filter.op, memoizedOptions.filter.value));
    }
    if (memoizedOptions?.sort) {
      collectionRef = query(collectionRef, orderBy(memoizedOptions.sort.by, memoizedOptions.sort.direction));
    }
    if (memoizedOptions?.limit) {
      collectionRef = query(collectionRef, limit(memoizedOptions.limit));
    }

    setLoading(true);
    const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
      setData(documents);
      setLoading(false);
    }, (error) => {
        console.error(`Error fetching collection ${collectionName}:`, error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, collectionName, memoizedOptions]);

  return { data, loading };
}
