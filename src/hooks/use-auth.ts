// src/hooks/use-auth.ts
'use client';

import React, { useContext } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '@/services/users.service';

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
