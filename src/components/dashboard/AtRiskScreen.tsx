import React from 'react';
import { Project } from '@/types';
import { AlertCircle, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { daysFromToday, isOverdue } from '@/lib/utils';
import { SubScreenShell } from './SubScreenShell';

/**
 * Every active project with at least one overdue milestone, worst-slipped
 * first, with per-milestone days overdue so the oldest fire is obvious.
 */
export function AtRiskScreen({
  projects,
  onOpenProject,
  onBack,
}: {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onBack: () => void;
}) {
  const atRisk = projects
    .filter((p) => p.status === 'ACTIVE')
    .map((p) => ({
      project: p,
      overdue: p.milestones
        .filter((m) => m.status !== 'COMPLETED' && isOverdue(m.dueDate))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    }))
    .filter(({ overdue }) => overdue.length > 0)
    // Worst slip first: the project holding the oldest overdue milestone.
    .sort((a, b) => a.overdue[0].dueDate.localeCompare(b.overdue[0].dueDate));

  return (
    <SubScreenShell
      title="At Risk / Delayed"
      subtitle="Active projects with overdue milestones, longest-slipped first."
      icon={<AlertCircle className="w-5 h-5" />}
      onBack={onBack}
    >
      {atRisk.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col items-center text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">All caught up</p>
          <p className="text-xs text-gray-500 mt-1">No active project has an overdue milestone.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {atRisk.map(({ project, overdue }) => {
            const done = project.milestones.filter((m) => m.status === 'COMPLETED').length;
            return (
              <div
                key={project.id}
                className="p-4 sm:p-5 rounded-2xl border border-red-200/60 dark:border-red-900/40 bg-white dark:bg-[#150f0f] shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {done}/{project.milestones.length} milestones completed · {overdue.length} overdue
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenProject(project.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                  >
                    Open project <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {overdue.map((m) => {
                    const days = -daysFromToday(m.dueDate);
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30"
                      >
                        <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{m.title}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-500 font-mono hidden sm:inline">
                            {format(new Date(m.dueDate), 'MMM d')}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3" />
                            {days} day{days !== 1 ? 's' : ''} overdue
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SubScreenShell>
  );
}
