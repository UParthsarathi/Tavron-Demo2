import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, Code2 } from 'lucide-react';

interface RoleTabsProps {
  activeRole: 'manager' | 'engineer';
  onRoleChange: (role: 'manager' | 'engineer') => void;
}

export function RoleTabs({ activeRole, onRoleChange }: RoleTabsProps) {
  return (
    <div className="flex p-1 bg-gray-100 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 relative mb-8">
      <button
        type="button"
        onClick={() => onRoleChange('manager')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors relative z-10 ${
          activeRole === 'manager' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <Briefcase className="w-4 h-4" />
        Manager
      </button>
      
      <button
        type="button"
        onClick={() => onRoleChange('engineer')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors relative z-10 ${
          activeRole === 'engineer' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <Code2 className="w-4 h-4" />
        Engineer
      </button>

      {/* Animated background pill */}
      <div className="absolute inset-1 pointer-events-none flex" aria-hidden="true">
        <motion.div
          className="w-1/2 h-full bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50"
          initial={false}
          animate={{
            x: activeRole === 'manager' ? '0%' : '100%'
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </div>
    </div>
  );
}
