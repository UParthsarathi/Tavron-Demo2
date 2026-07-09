import React from 'react';
import { Project } from '@/types';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { daysFromToday, isOverdue } from '@/lib/utils';

const PREVIEW_PROJECTS = 3;
const PREVIEW_MILESTONES = 3;

interface DelayedProjectsWidgetProps {
  projects: Project[];
  onViewAll: () => void;
}

export function DelayedProjectsWidget({ projects, onViewAll }: DelayedProjectsWidgetProps) {
  const delayedProjects = projects
    .filter((p) => p.status === 'ACTIVE')
    .map((p) => ({
      project: p,
      overdue: p.milestones
        .filter((m) => m.status !== 'COMPLETED' && isOverdue(m.dueDate))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    }))
    .filter(({ overdue }) => overdue.length > 0)
    .sort((a, b) => a.overdue[0].dueDate.localeCompare(b.overdue[0].dueDate));

  const preview = delayedProjects.slice(0, PREVIEW_PROJECTS);
  const hiddenProjects = delayedProjects.length - preview.length;

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
        <div className="space-y-4 flex-1">
          {preview.map(({ project, overdue }) => (
            <div
              key={project.id}
              className="p-3 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20"
            >
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{project.name}</h4>
              <div className="space-y-2 mt-2">
                {overdue.slice(0, PREVIEW_MILESTONES).map((m) => {
                  const days = -daysFromToday(m.dueDate);
                  return (
                    <div key={m.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5 min-w-0">
                        <span className="w-1 h-1 rounded-full bg-red-500 shrink-0"></span>
                        <span className="truncate">{m.title}</span>
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {days}d overdue
                      </span>
                    </div>
                  );
                })}
                {overdue.length > PREVIEW_MILESTONES && (
                  <p className="text-[11px] text-red-500/80">+{overdue.length - PREVIEW_MILESTONES} more overdue</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {delayedProjects.length > 0 && (
        <button
          onClick={onViewAll}
          className="mt-5 flex items-center justify-between text-xs font-medium text-red-600/80 dark:text-red-400/80 hover:text-red-700 dark:hover:text-red-300 transition-colors group"
        >
          <span>
            {hiddenProjects > 0
              ? `View all ${delayedProjects.length} delayed projects`
              : 'View details'}
          </span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </motion.div>
  );
}
