import React from 'react';
import { Engineer, EngineerTask, Project } from '@/types';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubScreenShell } from './SubScreenShell';

export interface EngineerLoad {
  engineer: Engineer;
  projectNames: string[];
  projectTasks: number; // open tasks inside active projects
  standaloneTasks: number; // open "Delegate Work" tasks
}

/**
 * Load per engineer across the whole org, computed from the engineer
 * directory so people with no assignments still appear (that's the "who is
 * free" half of the question). Open = not DONE; only ACTIVE projects count.
 */
export function computeEngineerLoads(
  projects: Project[],
  engineers: Engineer[],
  standaloneTasks: EngineerTask[]
): EngineerLoad[] {
  const byId = new Map<string, EngineerLoad>(
    engineers.map((e) => [e.id, { engineer: e, projectNames: [], projectTasks: 0, standaloneTasks: 0 }])
  );

  projects.forEach((p) => {
    if (p.status !== 'ACTIVE') return;
    p.engineers.forEach((e) => byId.get(e.id)?.projectNames.push(p.name));
    p.tasks.forEach((t) => {
      if (t.status === 'DONE') return;
      const load = byId.get(t.engineerId);
      if (load) load.projectTasks += 1;
    });
  });

  standaloneTasks.forEach((t) => {
    if (t.status === 'DONE') return;
    const load = byId.get(t.engineerId);
    if (load) load.standaloneTasks += 1;
  });

  return Array.from(byId.values()).sort((a, b) => {
    const ta = a.projectTasks + a.standaloneTasks;
    const tb = b.projectTasks + b.standaloneTasks;
    return tb - ta || b.projectNames.length - a.projectNames.length
      || a.engineer.name.localeCompare(b.engineer.name);
  });
}

export function WorkloadScreen({
  projects,
  engineers,
  standaloneTasks,
  onBack,
}: {
  projects: Project[];
  engineers: Engineer[];
  standaloneTasks: EngineerTask[];
  onBack: () => void;
}) {
  const loads = computeEngineerLoads(projects, engineers, standaloneTasks);
  const available = loads.filter((l) => l.projectTasks + l.standaloneTasks === 0);
  const openTotal = loads.reduce((s, l) => s + l.projectTasks + l.standaloneTasks, 0);

  const summary = [
    { label: 'Engineers', value: loads.length },
    { label: 'Available now', value: available.length },
    { label: 'Open tasks', value: openTotal },
  ];

  return (
    <SubScreenShell
      title="Workload Distribution"
      subtitle="Open tasks and project assignments across the whole team, busiest first."
      icon={<Users className="w-5 h-5" />}
      onBack={onBack}
    >
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        {summary.map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm"
          >
            <p className="text-2xl font-semibold font-mono text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        {loads.map(({ engineer, projectNames, projectTasks, standaloneTasks: delegated }) => {
          const open = projectTasks + delegated;
          return (
            <div
              key={engineer.id}
              className="flex items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
            >
              <div className="flex items-center gap-3 min-w-0">
                {engineer.avatar ? (
                  <img src={engineer.avatar} alt={engineer.name} className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300 shrink-0">
                    {engineer.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{engineer.name}</h4>
                    {open === 0 && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                        Available
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{engineer.role}</p>
                  {projectNames.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {projectNames.slice(0, 3).map((name) => (
                        <span
                          key={name}
                          className="text-[11px] text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md"
                        >
                          {name}
                        </span>
                      ))}
                      {projectNames.length > 3 && (
                        <span className="text-[11px] text-gray-400">+{projectNames.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={cn('text-lg font-semibold font-mono', open === 0 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white')}>
                  {open}
                </p>
                <p className="text-[11px] text-gray-500">
                  {open === 0 ? 'no open tasks' : `${projectTasks} project · ${delegated} delegated`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SubScreenShell>
  );
}
