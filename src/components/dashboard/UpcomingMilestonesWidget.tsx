import React from 'react';
import { Project, Milestone } from '@/types';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { daysFromToday } from '@/lib/utils';

const PREVIEW_COUNT = 5;

interface UpcomingMilestonesWidgetProps {
  projects: Project[];
  onViewAll: () => void;
}

export function UpcomingMilestonesWidget({ projects, onViewAll }: UpcomingMilestonesWidgetProps) {
  const upcoming: { project: Project; milestone: Milestone; days: number }[] = [];

  projects.forEach((p) => {
    if (p.status !== 'ACTIVE') return;
    p.milestones.forEach((m) => {
      const days = daysFromToday(m.dueDate);
      // Due today through 30 days out; overdue lives in the At Risk widget.
      if (m.status !== 'COMPLETED' && days >= 0 && days <= 30) {
        upcoming.push({ project: p, milestone: m, days });
      }
    });
  });

  upcoming.sort((a, b) => a.days - b.days);
  const hidden = upcoming.length - PREVIEW_COUNT;

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
        <div className="space-y-4 flex-1">
          {upcoming.slice(0, PREVIEW_COUNT).map(({ project, milestone, days }) => (
            <div
              key={milestone.id}
              className="flex justify-between items-start pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0"
            >
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{milestone.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{project.name}</p>
              </div>
              <div className="text-xs font-mono text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                {days === 0 ? 'Today' : format(new Date(milestone.dueDate), 'MMM d')}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onViewAll}
        className="mt-5 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
      >
        <span>{hidden > 0 ? `+${hidden} more — full timeline` : 'Full timeline'}</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </motion.div>
  );
}
