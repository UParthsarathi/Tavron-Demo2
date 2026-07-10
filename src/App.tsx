// DEMO BRANCH: no login / invite flow — AuthProvider shows the persona
// picker until a viewpoint is chosen, so by the time this renders there is
// always a profile with a role.

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ManagerLayout } from '@/components/layout/ManagerLayout';
import { EngineerLayout } from '@/components/layout/EngineerLayout';

export default function App() {
  const { role } = useAuth();

  if (role === 'ENGINEER') {
    return <EngineerLayout />;
  }

  return <ManagerLayout />;
}
