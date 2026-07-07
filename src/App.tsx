import React, { useState } from 'react';
import { AuthScreen, SetPasswordScreen, useInviteFlow } from '@/components/auth/AuthScreen';
import { useAuth } from '@/contexts/AuthContext';
import { ManagerLayout } from '@/components/layout/ManagerLayout';
import { EngineerLayout } from '@/components/layout/EngineerLayout';

export default function App() {
  const { session, role } = useAuth();
  const arrivedViaInvite = useInviteFlow();
  const [passwordSet, setPasswordSet] = useState(false);

  if (!session) {
    return <AuthScreen />;
  }

  // Invited users land here signed-in but without a password yet.
  if (arrivedViaInvite && !passwordSet) {
    return <SetPasswordScreen onDone={() => setPasswordSet(true)} />;
  }

  // Role comes from the user's DB profile (profiles.role), set at invite time.
  if (role === 'ENGINEER') {
    return <EngineerLayout />;
  }

  return <ManagerLayout />;
}
