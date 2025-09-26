// src/firebase/provider.tsx
'use client';

import React from 'react';

// This provider is a placeholder and doesn't need to do anything
// as Firebase instances are now directly imported where needed.
export function FirebaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
