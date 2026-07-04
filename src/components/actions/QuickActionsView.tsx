import React from 'react';
import { motion } from 'motion/react';
import { UserPlus, Briefcase, MessageSquare, Zap } from 'lucide-react';

const actions = [
  {
    title: 'Add Engineer',
    description: 'Invite a new engineer to the organization',
    icon: <UserPlus className="w-6 h-6 text-gray-900 dark:text-white" />,
    color: 'bg-gray-100 dark:bg-gray-800',
  },
  {
    title: 'Delegate Work',
    description: 'Assign independent tasks to engineers outside of specific projects',
    icon: <Briefcase className="w-6 h-6 text-gray-900 dark:text-white" />,
    color: 'bg-gray-100 dark:bg-gray-800',
  },
  {
    title: 'Direct Messages',
    description: 'To-and-fro communication with engineers',
    icon: <MessageSquare className="w-6 h-6 text-gray-900 dark:text-white" />,
    color: 'bg-gray-100 dark:bg-gray-800',
  }
];

export function QuickActionsView({ onActionClick }: { onActionClick?: (action: string) => void }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8">
      <div className="mb-6 sm:mb-10">
        <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4 sm:mb-6 tracking-tight flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {actions.map((action, idx) => (
            <motion.div
              key={action.title}
              onClick={() => onActionClick && onActionClick(action.title)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm flex flex-col hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-4">
                <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${action.color} shadow-sm border border-gray-200/50 dark:border-gray-700/50 group-hover:scale-105 transition-transform`}>
                  {action.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{action.title}</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {action.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
