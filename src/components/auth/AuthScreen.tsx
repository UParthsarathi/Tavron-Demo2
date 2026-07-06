import React, { useState } from 'react';
import { AuthLayout } from './layout/AuthLayout';
import { ManagerLoginForm } from './forms/ManagerLoginForm';
import { EngineerLoginForm } from './forms/EngineerLoginForm';
import { RoleTabs } from './components/RoleTabs';
import { motion, AnimatePresence } from 'motion/react';

export function AuthScreen() {
  const [activeRole, setActiveRole] = useState<'manager' | 'engineer'>('manager');

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h2>
        <p className="text-gray-500 dark:text-gray-400">Please select your role and sign in.</p>
      </div>

      <RoleTabs activeRole={activeRole} onRoleChange={setActiveRole} />

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeRole === 'manager' ? <ManagerLoginForm /> : <EngineerLoginForm />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
