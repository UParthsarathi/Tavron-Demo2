import React from 'react';
import { Project, Milestone } from '@/types';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface UpcomingMilestonesWidgetProps {
  projects: Project[];
}

export function UpcomingMilestonesWidget({ projects }: UpcomingMilestonesWidgetProps) {
  const upcoming: { project: Project, milestone: Milestone }[] = [];
  
  projects.forEach(p => {
    if (p.status !== 'ACTIVE') return;
    const projectPending = p.milestones
      .filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 2);
      
    projectPending.forEach(m => {
      const dueDate = new Date(m.dueDate);
      const now = new Date();
      // Look ahead up to 30 days, ignore past due
      if (isAfter(dueDate, now) && isBefore(dueDate, addDays(now, 30))) {
        upcoming.push({ project: p, milestone: m });
      }
    });
  });

  upcoming.sort((a, b) => new Date(a.milestone.dueDate).getTime() - new Date(b.milestone.dueDate).getTime());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm flex flex-col h-full"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          <Calendar className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Milestones</h3>
      </div>
      
      {upcoming.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <p className="text-sm text-gray-500">No upcoming milestones in the next 30 days.</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
          {upcoming.map(({ project, milestone }) => (
            <div key={milestone.id} className="flex justify-between items-start pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{milestone.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{project.name}</p>
              </div>
              <div className="text-xs font-mono text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                {format(new Date(milestone.dueDate), 'MMM d')}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
