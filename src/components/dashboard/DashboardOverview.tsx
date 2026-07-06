import React, { useState } from 'react';
import { Project } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, CheckCircle2, Users, AlertCircle, Calendar, Briefcase, ArrowLeft, ChevronRight } from 'lucide-react';
import { DelayedProjectsWidget } from './DelayedProjectsWidget';
import { UpcomingMilestonesWidget } from './UpcomingMilestonesWidget';
import { WorkloadWidget } from './WorkloadWidget';

interface DashboardOverviewProps {
  projects: Project[];
}

type DashboardView = 'main' | 'delayed_projects' | 'upcoming_milestones' | 'workload';

export function DashboardOverview({ projects }: DashboardOverviewProps) {
  const [activeView, setActiveView] = useState<DashboardView>('main');

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

  const views = [
    {
      id: 'delayed_projects' as const,
      title: 'At Risk / Delayed Projects',
      description: 'View projects that have passed their milestone deadlines.',
      icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
      bg: 'bg-red-50 dark:bg-red-900/30'
    },
    {
      id: 'upcoming_milestones' as const,
      title: 'Upcoming Milestones',
      description: 'Track upcoming deadlines and project phases.',
      icon: <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bg: 'bg-blue-50 dark:bg-blue-900/30'
    },
    {
      id: 'workload' as const,
      title: 'Team Workload',
      description: 'Monitor task distribution across engineers.',
      icon: <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      bg: 'bg-purple-50 dark:bg-purple-900/30'
    }
  ];

  return (
    <div className="mb-8 sm:mb-10 w-full relative">
      <AnimatePresence mode="wait">
        {activeView === 'main' ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 sm:space-y-8"
          >
            <section>
              <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4 sm:mb-6 tracking-tight">Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-6">
                {stats.map((stat, idx) => (
                  <div
                    key={stat.label}
                    className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm flex flex-col"
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
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4 sm:mb-6 tracking-tight">Detailed Reports</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
                {views.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className="text-left group p-5 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all flex flex-col h-full"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2.5 rounded-xl ${view.bg}`}>
                        {view.icon}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5">{view.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{view.description}</p>
                  </button>
                ))}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            <button
              onClick={() => setActiveView('main')}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-6 self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <div className="w-full">
              {activeView === 'delayed_projects' && <DelayedProjectsWidget projects={projects} />}
              {activeView === 'upcoming_milestones' && <UpcomingMilestonesWidget projects={projects} />}
              {activeView === 'workload' && <WorkloadWidget projects={projects} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
