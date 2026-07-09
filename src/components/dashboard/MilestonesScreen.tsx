import React from 'react';
import { Milestone, Project } from '@/types';
import { Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn, daysFromToday } from '@/lib/utils';
import { SubScreenShell } from './SubScreenShell';

type Entry = { project: Project; milestone: Milestone; days: number };

function relativeLabel(days: number): string {
  if (days < 0) return `${-days} day${days !== -1 ? 's' : ''} overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days} days`;
}

/** Every open milestone across active projects, on one grouped timeline. */
export function MilestonesScreen({
  projects,
  onOpenProject,
  onBack,
}: {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onBack: () => void;
}) {
  const entries: Entry[] = projects
    .filter((p) => p.status === 'ACTIVE')
    .flatMap((p) =>
      p.milestones
        .filter((m) => m.status !== 'COMPLETED')
        .map((m) => ({ project: p, milestone: m, days: daysFromToday(m.dueDate) }))
    )
    .sort((a, b) => a.days - b.days || a.milestone.title.localeCompare(b.milestone.title));

  const groups: { name: string; items: Entry[]; accent?: 'red' }[] = [
    { name: 'Overdue', items: entries.filter((e) => e.days < 0), accent: 'red' as const },
    { name: 'This week', items: entries.filter((e) => e.days >= 0 && e.days <= 7) },
    { name: 'This month', items: entries.filter((e) => e.days > 7 && e.days <= 30) },
    { name: 'Later', items: entries.filter((e) => e.days > 30) },
  ].filter((g) => g.items.length > 0);

  return (
    <SubScreenShell
      title="Milestone Timeline"
      subtitle={`Every open milestone across active projects — ${entries.length} total.`}
      icon={<Calendar className="w-5 h-5" />}
      onBack={onBack}
    >
      {entries.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center">
          <p className="text-sm text-gray-500">No open milestones on active projects.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.name}>
              <h3
                className={cn(
                  'text-xs font-bold uppercase tracking-wider mb-3',
                  group.accent === 'red' ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
                )}
              >
                {group.name} · {group.items.length}
              </h3>
              <div className="space-y-2">
                {group.items.map(({ project, milestone, days }) => (
                  <button
                    key={milestone.id}
                    onClick={() => onOpenProject(project.id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-colors group',
                      days < 0
                        ? 'border-red-200/60 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 hover:border-red-300 dark:hover:border-red-800'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          days < 0 ? 'bg-red-500' : milestone.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        )}
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {milestone.title}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">{project.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-mono text-gray-500">
                          {format(new Date(milestone.dueDate), 'MMM d')}
                        </p>
                        <p
                          className={cn(
                            'text-[11px] font-medium',
                            days < 0 ? 'text-red-600 dark:text-red-400' : days <= 7 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'
                          )}
                        >
                          {relativeLabel(days)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </SubScreenShell>
  );
}
