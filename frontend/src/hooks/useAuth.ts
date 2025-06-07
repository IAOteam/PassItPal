// src/hooks/useAuth.ts
import { AuthContext, type AuthContextType } from '@/context/AuthContext';
import { useContext } from 'react';
// Adjust path if AuthContextType is also moved or separately exported

export const useAuth = (): AuthContextType => { // Ensure AuthContextType is accessible
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};