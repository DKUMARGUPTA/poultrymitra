// src/firebase/provider.tsx
'use client';

import React from 'react';
import { FirebaseProvider as FirebaseProviderInternal } from './provider';

// This provider is now simplified as it doesn't need to hold the instances.
// We keep it for structural consistency and potential future use.
export function FirebaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
