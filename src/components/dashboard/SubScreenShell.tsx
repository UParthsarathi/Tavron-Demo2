import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Chrome shared by the dashboard detail screens (workload, at-risk,
 * milestones): a back-to-dashboard bar, a title block, and the content well.
 */
export function SubScreenShell({
  title,
  subtitle,
  icon,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto px-3 sm:px-8 py-4 sm:py-8"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Dashboard
      </button>

      <div className="mb-6 sm:mb-8 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200/60 dark:border-gray-700/60">
          {icon}
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {children}
    </motion.div>
  );
}
