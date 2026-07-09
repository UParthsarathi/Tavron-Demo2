import React, { useState } from 'react';
import { DailyLog, Engineer, EngineerTask, Project } from '@/types';
import { motion } from 'framer-motion';
import { BadgeCheck, BarChart3, CheckCircle2, Users } from 'lucide-react';
import { DelayedProjectsWidget } from './DelayedProjectsWidget';
import { UpcomingMilestonesWidget } from './UpcomingMilestonesWidget';
import { WorkloadWidget } from './WorkloadWidget';
import { WorkloadScreen } from './WorkloadScreen';
import { AtRiskScreen } from './AtRiskScreen';
import { MilestonesScreen } from './MilestonesScreen';

type DashboardScreen = 'overview' | 'workload' | 'atrisk' | 'milestones';

interface DashboardOverviewProps {
  projects: Project[];
  engineers: Engineer[];
  standaloneTasks: EngineerTask[];
  logs: DailyLog[];
  onOpenProject: (projectId: string) => void;
  onOpenLogs: () => void;
}

/**
 * The dashboard: an overview of stat tiles + three widgets, each widget
 * opening a full detail screen (workload, at-risk, milestone timeline).
 * Screen state lives here so the header's Dashboard tab stays active.
 */
export function DashboardOverview({ projects, engineers, standaloneTasks, logs, onOpenProject, onOpenLogs }: DashboardOverviewProps) {
  const [screen, setScreen] = useState<DashboardScreen>('overview');
  const back = () => setScreen('overview');

  if (screen === 'workload') {
    return (
      <WorkloadScreen projects={projects} engineers={engineers} standaloneTasks={standaloneTasks} onBack={back} />
    );
  }
  if (screen === 'atrisk') {
    return <AtRiskScreen projects={projects} onOpenProject={onOpenProject} onBack={back} />;
  }
  if (screen === 'milestones') {
    return <MilestonesScreen projects={projects} onOpenProject={onOpenProject} onBack={back} />;
  }

  const activeProjects = projects.filter(p => p.status === 'ACTIVE');
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;

  // Engineers staffed on an active project right now — completed projects
  // don't keep anyone "active" forever.
  const staffed = new Set<string>();
  activeProjects.forEach(p => p.engineers.forEach(e => staffed.add(e.id)));

  // Today's log review state: engineer-days logged but not yet verified.
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const todaysLogs = logs.filter(l => l.logDate === todayStr);
  const pendingReview = new Set(todaysLogs.filter(l => !l.verifiedByName).map(l => l.authorId)).size;

  const stats = [
    {
      label: 'Active Projects',
      value: activeProjects.length.toString(),
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
      label: 'Engineers on Projects',
      value: `${staffed.size}/${engineers.length}`,
      icon: <Users className="w-4 h-4 text-gray-900 dark:text-gray-100" />,
      subtext: 'Staffed on active projects',
      color: 'bg-gray-100 dark:bg-gray-800',
    }
  ];

  return (
    <div className="mb-8 sm:mb-10 space-y-6 sm:space-y-8">
      <section>
        <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4 sm:mb-6 tracking-tight">Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-6">
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

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={onOpenLogs}
            className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm flex flex-col text-left hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-8">
              <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl shadow-sm border ${pendingReview > 0 ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200/60 dark:border-amber-800/50' : 'bg-gray-100 dark:bg-gray-800 border-gray-200/50 dark:border-gray-700/50'}`}>
                <BadgeCheck className={`w-4 h-4 ${pendingReview > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight font-mono">{pendingReview}</h3>
              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mt-1 sm:mt-2">Logs Pending Review</p>
              <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-500 mt-1.5">
                {pendingReview > 0 ? 'Tap to review today’s logs' : 'All of today’s logs verified'}
              </p>
            </div>
          </motion.button>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6 items-start">
        <DelayedProjectsWidget projects={projects} onViewAll={() => setScreen('atrisk')} />
        <UpcomingMilestonesWidget projects={projects} onViewAll={() => setScreen('milestones')} />
        <WorkloadWidget
          projects={projects}
          engineers={engineers}
          standaloneTasks={standaloneTasks}
          onViewAll={() => setScreen('workload')}
        />
      </section>
    </div>
  );
}
