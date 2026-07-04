import React from 'react';
import { Project } from '@/types';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DelayedProjectsWidgetProps {
  projects: Project[];
}

export function DelayedProjectsWidget({ projects }: DelayedProjectsWidgetProps) {
  const delayedProjects = projects.filter(p => {
    if (p.status !== 'ACTIVE') return false;
    return p.milestones.some(m => {
      const isPastDue = new Date(m.dueDate).getTime() < Date.now();
      return isPastDue && m.status !== 'COMPLETED';
    });
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl border border-red-200/60 dark:border-red-900/40 bg-white dark:bg-[#150f0f] shadow-sm flex flex-col h-full"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">At Risk / Delayed</h3>
      </div>
      
      {delayedProjects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">All caught up</p>
          <p className="text-xs text-gray-500 mt-1">No delayed projects</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
          {delayedProjects.map(project => {
            const delayedMilestones = project.milestones.filter(m => new Date(m.dueDate).getTime() < Date.now() && m.status !== 'COMPLETED');
            return (
              <div key={project.id} className="p-3 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{project.name}</h4>
                <div className="space-y-2 mt-2">
                  {delayedMilestones.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-red-500"></div>
                        {m.title}
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Past due
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
