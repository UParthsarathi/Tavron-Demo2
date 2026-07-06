import React from 'react';
import { AlertCircle } from 'lucide-react';
import { EngineerTask } from '@/types';

export interface TaskWithContext extends EngineerTask {
  projectName: string;
  projectId: string;
}

interface EngineerActiveTasksProps {
  tasks: TaskWithContext[];
}

export function EngineerActiveTasks({ tasks }: EngineerActiveTasksProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        My Active Tasks
      </h3>
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        {tasks.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {tasks.slice(0, 10).map(task => (
              <div key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium whitespace-nowrap">
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                  Project: {task.projectName}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No active tasks assigned to you.
          </div>
        )}
      </div>
    </div>
  );
}
