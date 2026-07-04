import React from 'react';
import { Project, Engineer } from '@/types';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface WorkloadWidgetProps {
  projects: Project[];
}

export function WorkloadWidget({ projects }: WorkloadWidgetProps) {
  const engineerLoad = new Map<string, { engineer: Engineer, activeProjects: number, tasks: number }>();

  projects.forEach(p => {
    if (p.status !== 'ACTIVE') return;
    
    p.engineers.forEach(e => {
      if (!engineerLoad.has(e.id)) {
        engineerLoad.set(e.id, { engineer: e, activeProjects: 0, tasks: 0 });
      }
      engineerLoad.get(e.id)!.activeProjects += 1;
    });

    p.tasks.forEach(t => {
      if (t.status !== 'DONE' && engineerLoad.has(t.engineerId)) {
        engineerLoad.get(t.engineerId)!.tasks += 1;
      }
    });
  });

  const loadList = Array.from(engineerLoad.values()).sort((a, b) => b.tasks - a.tasks);

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
      
      {loadList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <p className="text-sm text-gray-500">No active engineers.</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
          {loadList.map(({ engineer, activeProjects, tasks }) => (
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
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tasks} <span className="text-xs text-gray-500 font-normal">tasks</span></p>
                <p className="text-xs text-gray-500">{activeProjects} projects</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
