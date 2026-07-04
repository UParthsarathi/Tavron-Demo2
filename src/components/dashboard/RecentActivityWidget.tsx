import React from 'react';
import { Project } from '@/types';
import { motion } from 'framer-motion';
import { Activity, Plus, FileText, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityWidgetProps {
  projects: Project[];
}

export function RecentActivityWidget({ projects }: RecentActivityWidgetProps) {
  const activities: { id: string, type: string, message: string, date: Date, icon: React.ReactNode }[] = [];

  projects.forEach(p => {
    activities.push({
      id: `p-${p.id}`,
      type: 'project_created',
      message: `Project "${p.name}" created`,
      date: new Date(p.createdAt),
      icon: <Plus className="w-4 h-4 text-emerald-500" />
    });

    p.docs.forEach(d => {
      activities.push({
        id: `d-${d.id}`,
        type: 'doc_added',
        message: `Added doc "${d.title}" to ${p.name}`,
        date: new Date(d.dateAdded),
        icon: <FileText className="w-4 h-4 text-blue-500" />
      });
    });

    p.tasks.forEach(t => {
      activities.push({
        id: `t-${t.id}`,
        type: 'task_created',
        message: `Task "${t.title}" added to ${p.name}`,
        date: new Date(t.createdAt),
        icon: <CheckCircle className="w-4 h-4 text-indigo-500" />
      });
      if (t.status === 'DONE') {
        // Mock a completion date slightly after created
        activities.push({
          id: `t-done-${t.id}`,
          type: 'task_completed',
          message: `Completed "${t.title}"`,
          date: new Date(new Date(t.createdAt).getTime() + 3600000),
          icon: <CheckCircle className="w-4 h-4 text-emerald-500" />
        });
      }
    });
  });

  activities.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm flex flex-col h-full"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <Activity className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
      </div>
      
      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        {activities.slice(0, 5).map(activity => (
          <div key={activity.id} className="flex gap-3">
            <div className="mt-0.5 p-1.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 h-fit">
              {activity.icon}
            </div>
            <div>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-tight mb-1">{activity.message}</p>
              <p className="text-xs text-gray-500 font-mono">{formatDistanceToNow(activity.date, { addSuffix: true })}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
