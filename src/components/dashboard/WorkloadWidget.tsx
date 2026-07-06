import React, { useState, useEffect } from 'react';
import { Project, Engineer } from '@/types';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface WorkloadWidgetProps {
  projects: Project[];
}

interface EngineerWorkload {
  engineer: Engineer;
  activeProjects: number;
  projectTasks: number;
  delegatedTasks: number;
  totalLoad: number;
}

export function WorkloadWidget({ projects }: WorkloadWidgetProps) {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [delegatedCounts, setDelegatedCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/engineers').then(res => res.json()),
      fetch('/api/delegated-tasks-count').then(res => res.json())
    ]).then(([engineersData, delegatedData]) => {
      setEngineers(engineersData);
      
      const counts: Record<string, number> = {};
      delegatedData.forEach((row: any) => {
        // chat_id is like 'eng-1'
        const engId = row.chat_id.replace('eng-', 'eng-');
        counts[engId] = row.count;
      });
      setDelegatedCounts(counts);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const loadList: EngineerWorkload[] = engineers.map(engineer => {
    let activeProjects = 0;
    let projectTasks = 0;

    projects.forEach(p => {
      if (p.status !== 'ACTIVE') return;
      
      if (p.engineers.some(e => e.id === engineer.id)) {
        activeProjects += 1;
      }
      
      p.tasks?.forEach(t => {
        if (t.status !== 'DONE' && t.engineerId === engineer.id) {
          projectTasks += 1;
        }
      });
    });

    const delegatedTasks = delegatedCounts[engineer.id] || 0;
    const totalTasks = projectTasks + delegatedTasks;
    const totalLoad = totalTasks + activeProjects;

    return {
      engineer,
      activeProjects,
      projectTasks,
      delegatedTasks,
      totalLoad
    };
  }).sort((a, b) => a.totalLoad - b.totalLoad);

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
        <h3 className="font-semibold text-gray-900 dark:text-white">Team Workload</h3>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-6">
          <span className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></span>
        </div>
      ) : loadList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <p className="text-sm text-gray-500">No engineers available.</p>
        </div>
      ) : (
        <div className="space-y-5 flex-1 overflow-y-auto pr-2">
          {loadList.map(({ engineer, activeProjects, projectTasks, delegatedTasks, totalLoad }) => {
            const totalTasks = projectTasks + delegatedTasks;
            return (
              <div key={engineer.id} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
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
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activeProjects} <span className="text-xs text-gray-500 font-normal">proj</span></p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{totalTasks} <span className="text-xs text-gray-500 font-normal">tasks</span></p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
