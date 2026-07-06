import React from 'react';
import { Clock, Calendar } from 'lucide-react';
import { Milestone } from '@/types';

export interface MilestoneWithContext extends Milestone {
  projectName: string;
  projectId: string;
}

interface EngineerUpcomingMilestonesProps {
  milestones: MilestoneWithContext[];
}

export function EngineerUpcomingMilestones({ milestones }: EngineerUpcomingMilestonesProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-500" />
        Project Milestones
      </h3>
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        {milestones.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {milestones.map(m => (
              <div key={m.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{m.title}</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(m.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                  Project: {m.projectName}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No upcoming milestones.
          </div>
        )}
      </div>
    </div>
  );
}
