import React from 'react';
import { Project } from '@/types';
import { motion } from 'framer-motion';
import { BarChart3, CheckCircle2, Users } from 'lucide-react';
import { DelayedProjectsWidget } from './DelayedProjectsWidget';
import { UpcomingMilestonesWidget } from './UpcomingMilestonesWidget';
import { WorkloadWidget } from './WorkloadWidget';

interface DashboardOverviewProps {
  projects: Project[];
}

export function DashboardOverview({ projects }: DashboardOverviewProps) {
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  
  const uniqueEngineers = new Set<string>();

  projects.forEach(p => {
    p.engineers.forEach(e => uniqueEngineers.add(e.id));
  });

  const stats = [
    {
      label: 'Active Projects',
      value: activeProjects.toString(),
      icon: <BarChart3 className="w-4 h-4 text-gray-900 dark:text-gray-100" />,
      subtext: `${projects.length} total projects`,
      color: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      label: 'Projects Completed',
      value: completedProjects.toString(),
      icon: <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-gray-100" />,
      subtext: 'Successfully delivered',
      color: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      label: 'Active Engineers',
      value: uniqueEngineers.size.toString(),
      icon: <Users className="w-4 h-4 text-gray-900 dark:text-gray-100" />,
      subtext: 'Across all projects',
      color: 'bg-gray-100 dark:bg-gray-800',
    }
  ];

  return (
    <div className="mb-8 sm:mb-10 space-y-6 sm:space-y-8">
      <section>
        <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4 sm:mb-6 tracking-tight">Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm flex flex-col hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-8">
                <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${stat.color} shadow-sm border border-gray-200/50 dark:border-gray-700/50`}>
                  {stat.icon}
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight font-mono">{stat.value}</h3>
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mt-1 sm:mt-2">{stat.label}</p>
                <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-500 mt-1.5">{stat.subtext}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        <DelayedProjectsWidget projects={projects} />
        <UpcomingMilestonesWidget projects={projects} />
        <WorkloadWidget projects={projects} />
      </section>
    </div>
  );
}
