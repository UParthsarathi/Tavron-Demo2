import React from 'react';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { useAuth } from '@/contexts/AuthContext';
import { determineUserRole } from '@/types/roles';
import { ManagerLayout } from '@/components/layout/ManagerLayout';
import { EngineerLayout } from '@/components/layout/EngineerLayout';

export default function App() {
  const { session, user } = useAuth();
  
  if (!session) {
    return <AuthScreen />;
  }

  const role = determineUserRole(user?.email);

  if (role === 'ENGINEER') {
    return <EngineerLayout />;
  }

  // Default to Manager Layout for PM/Admin and any unknown roles 
  // (to maintain existing functionality if email doesn't strictly match)
  return <ManagerLayout />;
}

