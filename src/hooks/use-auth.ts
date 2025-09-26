
// src/hooks/use-auth.ts
"use client";

import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/components/auth-provider';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // A more robust loading check.
  // If we have a user object but no profile yet, we are still loading.
  const isLoading = context.loading || (!!context.user && !context.userProfile);

  return {
    ...context,
    loading: isLoading,
  };
};
