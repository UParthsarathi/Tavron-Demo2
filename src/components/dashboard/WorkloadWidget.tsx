import React from 'react';
import { Engineer, EngineerTask, Project } from '@/types';
import { motion } from 'framer-motion';
import { ArrowRight, Users } from 'lucide-react';
import { computeEngineerLoads } from './WorkloadScreen';

const PREVIEW_COUNT = 6;

interface WorkloadWidgetProps {
  projects: Project[];
  engineers: Engineer[];
  standaloneTasks: EngineerTask[];
  onViewAll: () => void;
}

/**
 * Compact preview of the busiest engineers. Counts standalone ("Delegate
 * Work") tasks too, and the full screen behind View All includes idle
 * engineers — the two blind spots of the original widget.
 */
export function WorkloadWidget({ projects, engineers, standaloneTasks, onViewAll }: WorkloadWidgetProps) {
  const loads = computeEngineerLoads(projects, engineers, standaloneTasks);
  const preview = loads.slice(0, PREVIEW_COUNT);
  const availableCount = loads.filter((l) => l.projectTasks + l.standaloneTasks === 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm flex flex-col h-full"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          <Users className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">Workload Distribution</h3>
      </div>

      {loads.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <p className="text-sm text-gray-500">No engineers yet.</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {preview.map(({ engineer, projectNames, projectTasks, standaloneTasks: delegated }) => (
            <div key={engineer.id} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {engineer.avatar ? (
                  <img src={engineer.avatar} alt={engineer.name} className="w-8 h-8 rounded-full bg-gray-100" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                    {engineer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{engineer.name}</h4>
                  <p className="text-xs text-gray-500">{engineer.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {projectTasks + delegated} <span className="text-xs text-gray-500 font-normal">tasks</span>
                </p>
                <p className="text-xs text-gray-500">{projectNames.length} projects</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onViewAll}
        className="mt-5 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
      >
        <span>
          All {loads.length} engineers{availableCount > 0 ? ` · ${availableCount} available` : ''}
        </span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </motion.div>
  );
}
